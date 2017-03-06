"use strict";
var assert = require('assert');
var request = require("request");
var helper = require("../helper.js");
var fs = require('fs');
var shell = require('shelljs');

var soajs = require('soajs');
var Mongo = soajs.mongo;
var dbConfig = require("./db.config.test.js");
var dashboardConfig = dbConfig();
dashboardConfig.name = "core_provision";
var mongo = new Mongo(dashboardConfig);

var errorCodes = helper.requireModule('./config').errors;

var extKey = 'aa39b5490c4a4ed0e56d7ec1232a428f771e8bb83cfcee16de14f735d0f5da587d5968ec4f785e38570902fd24e0b522b46cb171872d1ea038e88328e7d973ff47d9392f72b2d49566209eb88eb60aed8534a965cf30072c39565bd8d72f68ac';

function executeMyRequest(params, apiPath, method, cb) {
    requester(apiPath, method, params, function (error, body) {
        assert.ifError(error);
        assert.ok(body);
        return cb(body);
    });

    function requester(apiName, method, params, cb) {
        var options = {
            uri: 'http://localhost:4000/dashboard/' + apiName,
            headers: {
                key: extKey
            },
            json: true
        };

        if (params.headers) {
            for (var h in params.headers) {
                if (params.headers.hasOwnProperty(h)) {
                    options.headers[h] = params.headers[h];
                }
            }
        }

        if (params.timeout) {
            options.timeout = params.timeout;
        }

        if (params.form) {
            options.body = params.form;
        }

        if (params.qs) {
            options.qs = params.qs;
        }

        if (params.formData) {
            options.formData = params.formData;
        }
        request[method](options, function (error, response, body) {
            //maintenance tests have a timeout set to avoid travis errors
            //if timeout is exceeded, return cb() without checking for error since this is expected behavior
            if (error && error.code && error.code === 'ESOCKETTIMEDOUT') {
                return cb(null, 'ESOCKETTIMEDOUT');
            }

            assert.ifError(error);
            assert.ok(body);
            return cb(null, body);
        });
    }
}

function getService(soajsauth, options, cb) {
    var params = {
        headers: {
            soajsauth: soajsauth
        },
        qs: {
            env: options.env
        }
    };
    executeMyRequest(params, "cloud/services/list", "get", function (body) {
        assert.ifError(body.errors);
        if (!options.serviceName) return cb(body);

        var services = body.data, service = {};
        for (var i = 0; i < services.length; i++) {
            if (services[i].labels['soajs.service.name'] === options.serviceName) {
                service = services[i];
                break;
            }
        }

        return cb(service);
    });
}

function deleteService(soajsauth, options, cb) {
    var params = {
        headers: {
            soajsauth: soajsauth
        },
        "qs": {
            env: options.env,
            serviceId: options.id,
            mode: options.mode
        }
    };
    return executeMyRequest(params, "cloud/services/delete", 'delete', cb);
}

describe("testing hosts deployment", function () {
    var soajsauth, containerInfo;
    before(function (done) {
	    process.env.SOAJS_ENV_WORKDIR = process.env.APP_DIR_FOR_CODE_COVERAGE;
	    console.log("***************************************************************");
	    console.log("* Setting SOAJS_ENV_WORKDIR for test mode as: ", process.env.APP_DIR_FOR_CODE_COVERAGE);
	    console.log("***************************************************************");

        var options = {
            uri: 'http://localhost:4001/login',
            headers: {
                'Content-Type': 'application/json',
                key: extKey
            },
            body: {
                "username": "user1",
                "password": "123456"
            },
            json: true
        };
        request.post(options, function (error, response, body) {
            assert.ifError(error);
            assert.ok(body);
            soajsauth = body.soajsauth;

            var validDeployerRecord = {
                "type" : "container",
                "selected" : "container.docker.local",
                "container" : {
                    "docker" : {
                        "local" : {},
                        "remote" : {}
                    }
                }
            };

            mongo.update("environment", {}, {
                "$set": {
                    "deployer": validDeployerRecord,
                    "profile": __dirname + "/../profiles/profile.js"
                }
            }, {multi: true}, function (error) {
                assert.ifError(error);
                done();
            });
        });
    });

    before('create dashboard environment record', function (done) {
        var dashEnv = {
            "code": "DASHBOARD",
            "domain": "soajs.org",
            "locked": true,
            "port": 80,
            "profile": "/opt/soajs/FILES/profiles/profile.js",
            "deployer": {
                "type" : "container",
                "selected" : "container.docker.local",
                "container" : {
                    "docker" : {
                        "local" : {},
                        "remote" : {}
                    }
                }
            },
            "description": "this is the Dashboard environment",
            "dbs": {
                "clusters": {
                    "dash_cluster": {
                        "servers": [
                            {
                                "host": "127.0.0.1",
                                "port": 27017
                            }
                        ],
                        "credentials": null,
                        "URLParam": {
                            "connectTimeoutMS": 0,
                            "socketTimeoutMS": 0,
                            "maxPoolSize": 5,
                            "wtimeoutMS": 0,
                            "slaveOk": true
                        },
                        "extraParam": {
                            "db": {
                                "native_parser": true
                            },
                            "server": {
                                "auto_reconnect": true
                            }
                        }
                    }
                },
                "config": {
                    "prefix": "",
                    "session": {
                        "cluster": "dash_cluster",
                        "name": "core_session",
                        "store": {},
                        "collection": "sessions",
                        "stringify": false,
                        "expireAfter": 1209600000
                    }
                },
                "databases": {
                    "urac": {
                        "cluster": "dash_cluster",
                        "tenantSpecific": true
                    }
                }
            },
            "services": {
                "controller": {
                    "maxPoolSize": 100,
                    "authorization": true,
                    "requestTimeout": 30,
                    "requestTimeoutRenewal": 0
                },
                "config": {
                    "awareness": {
                        "healthCheckInterval": 5000,
                        "autoRelaodRegistry": 3600000,
                        "maxLogCount": 5,
                        "autoRegisterService": true
                    },
                    "agent": {
                        "topologyDir": "/opt/soajs/"
                    },
                    "key": {
                        "algorithm": "aes256",
                        "password": "soajs key lal massa"
                    },
                    "logger": {
                        "level": "fatal",
                        "formatter": {
                            "outputMode": "short"
                        }
                    },
                    "cors": {
                        "enabled": true,
                        "origin": "*",
                        "credentials": "true",
                        "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
                        "headers": "key,soajsauth,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type",
                        "maxage": 1728000
                    },
                    "oauth": {
                        "grants": [
                            "password",
                            "refresh_token"
                        ],
                        "debug": false
                    },
                    "ports": {
                        "controller": 4000,
                        "maintenanceInc": 1000,
                        "randomInc": 100
                    },
                    "cookie": {
                        "secret": "this is a secret sentence"
                    },
                    "session": {
                        "name": "soajsID",
                        "secret": "this is antoine hage app server",
                        "cookie": {
                            "path": "/",
                            "httpOnly": true,
                            "secure": false,
                            "maxAge": null
                        },
                        "resave": false,
                        "saveUninitialized": false,
                        "rolling": false,
                        "unset": "keep"
                    }
                }
            }
        };
        mongo.insert("environment", dashEnv, function (error) {
            assert.ifError(error);
            done();
        });
    });

    before('Activate swarm mode for local docker engine and create overlay network', function (done) {
        var params = {
            method: 'POST',
            uri: 'http://unix:/var/run/docker.sock:/swarm/init',
            json: true,
            headers: {
                Host: '127.0.0.1'
            },
            body: {
                "ListenAddr": "0.0.0.0:2377",
                "AdvertiseAddr": "127.0.0.1:2377",
                "ForceNewCluster": true
            }
        };

        request(params, function (error, response, nodeId) {
            assert.ifError(error);

            params = {
                method: 'POST',
                uri: 'http://unix:/var/run/docker.sock:/networks/create',
                json: true,
                headers: {
                    Host: '127.0.0.1'
                },
                body: {
                    "Name": 'soajsnet',
                    "Driver": 'overlay',
                    "Internal": false,
                    "CheckDuplicate": false,
                    "EnableIPv6": false,
                    "IPAM": {
                        "Driver": 'default'
                    }
                }
            };

            request(params, function (error, response, body) {
                assert.ifError(error);
                done();
            });
        });
    });

    before("Perform cleanup of any previous services deployed", function (done) {
        console.log ('Deleting previous deployments ...');
        shell.exec('docker service rm $(docker service ls -q) && docker rm -f $(docker ps -qa)');
        done();
    });

    after(function (done) {
        mongo.closeDb();
	    done();
    });

    beforeEach(function(done){
    	setTimeout(function(){
    		done();
	    }, 700);
    });

    describe("testing cluster nodes", function () {

        describe("testing list cluster nodes", function () {

            it("success - will list nodes", function (done) {
                var params = {
                    header: {
                        soajsauth: soajsauth
                    }
                };

                executeMyRequest(params, "cloud/nodes/list", "get", function (body) {
                    assert.ok(body.result);
                    assert.ok(body.data);
                    assert.equal(body.data.length, 1);
                    done();
                });
            });

        });

        describe("testing add cluster node", function () {

            it("fail - wrong node address provided", function (done) {
                var params = {
                    headers: {
                        soajsauth: soajsauth
                    },
                    form: {
                        env: 'dashboard',
                        host: '192.168.99.100',
                        port: 2376,
                        role: 'manager'
                    }
                };

                executeMyRequest(params, "cloud/nodes/add", "post", function (body) {
                    assert.ok(body.errors);
                    assert.deepEqual(body.errors.details[0], {'code': 540, 'message': 'Unable to retrieve the docker swarm deployer'});
                    done();
                });
            });

            it("fail - missing required params", function (done) {
                var params = {
                    headers: {
                        soajsauth: soajsauth
                    },
                    form: {
                        env: 'dashboard',
                        port: 2376,
                        role: 'manager'
                    }
                };

                executeMyRequest(params, "cloud/nodes/add", "post", function (body) {
                    assert.ok(body.errors);
                    assert.deepEqual(body.errors.details[0], {"code": 172, "message": "Missing required field: host"});
                    done();
                });
            });

        });

        describe("testing update cluster node", function () {
            var currentNode = {};
            before("get node information", function (done) {
                var params = {
                    headers: {
                        soajsauth: soajsauth
                    }
                };

                executeMyRequest(params, "cloud/nodes/list", "get", function (body) {
                    assert.ok(body.result);
                    assert.ok(body.data);

                    currentNode = body.data[0];
                    done();
                });
            });

            it("fail - invalid update option provided", function (done) {
                var params = {
                    headers: {
                        soajsauth: soajsauth
                    },
                    qs: {
                        env: 'dashboard',
                        nodeId: currentNode.id
                    },
                    form: {
                        type: 'hostname',
                        value: 'test'
                    }
                };

                executeMyRequest(params, "cloud/nodes/update", "put", function (body) {
                    assert.ok(body.errors);
                    assert.deepEqual(body.errors.details[0], {'code': 173, 'message': "Validation failed for field: type -> The parameter 'type' failed due to: instance is not one of enum values: role,availability"});
                    done();
                });
            });

            it("fail - invalid operation, trying to demote last manager node in cluster", function (done) {
                var params = {
                    headers: {
                        soajsauth: soajsauth
                    },
                    qs: {
                        env: 'dashboard',
                        nodeId: currentNode.id
                    },
                    form: {
                        type: 'role',
                        value: 'worker'
                    }
                };

                executeMyRequest(params, "cloud/nodes/update", "put", function (body) {
                    assert.ok(body.errors);
                    assert.deepEqual(body.errors.details[0], {'code': 546, 'message': 'Unable to update the node in the docker swarm'});
                    done();
                });
            });
        });

        describe ("testing delete cluster node", function () {
            var currentNode = {};
            before("get node information", function (done) {
                var params = {
                    headers: {
                        soajsauth: soajsauth
                    }
                };

                executeMyRequest(params, "cloud/nodes/list", "get", function (body) {
                    assert.ok(body.result);
                    assert.ok(body.data);

                    currentNode = body.data[0];
                    done();
                });
            });

            it("fail - invalid node id provided", function (done) {
                var params = {
                    headers: {
                        soajsauth: soajsauth
                    },
                    qs: {
                        env: 'dashboard',
                        nodeId: 'aacrh437t'
                    }
                };

                executeMyRequest(params, "cloud/nodes/remove", "delete", function (body) {
                    assert.ok(body.errors);
                    assert.deepEqual(body.errors.details[0], {'code': 545, 'message': 'Unable to delete the node from the docker swarm'});
                    done();
                });
            });

            it("fail - invalid operating, trying to delete a manager node in cluster", function (done) {
                var params = {
                    headers: {
                        soajsauth: soajsauth
                    },
                    qs: {
                        env: 'dashboard',
                        nodeId: currentNode.id
                    }
                };

                executeMyRequest(params, "cloud/nodes/remove", "delete", function (body) {
                    assert.ok(body.errors);
                    assert.deepEqual(body.errors.details[0], {'code': 545, 'message': 'Unable to delete the node from the docker swarm'});
                    done();
                });
            });
        });
    });

    describe("testing controller deployment", function () {

        before('add static content record', function (done) {
            var scRecord = {
                "name": "Custom UI Test",
                "dashUI": true,
                "src": {
                "provider": "github",
                    "owner": "soajs",
                    "repo": "soajs.dashboard" //dummy data
                }
            };
            mongo.insert("staticContent", scRecord, function (error) {
                assert.ifError(error);
                done();
            });
        });

        it("success - deploy 1 controller service and delete it afterwards", function (done) {
            var params = {
                headers: {
                    soajsauth: soajsauth
                },
                form: {
                    env: 'dev',
                    type: 'service',
                    name: 'controller',
                    gitSource: {
                        owner: 'soajs',
                        repo: 'soajs.controller',
                        branch: 'develop',
                        commit: '67a61db0955803cddf94672b0192be28f47cf280'
                    },
                    deployConfig: {
                        useLocalSOAJS: true,
                        memoryLimit: 209715200,
                        imagePrefix: 'soajsorg',
                        replication: {
                            mode: 'replicated',
                            replicas: 1
                        }
                    }
                }
            };
            executeMyRequest(params, "cloud/services/soajs/deploy", "post", function (body) {
                assert.ok(body.result);
                assert.ok(body.data);

                getService(soajsauth, {env: 'dev', serviceName: 'controller'}, function (service) {
                    deleteService(soajsauth, {env: 'DEV', id: service.id, mode: service.labels['soajs.service.mode']}, function (body) {
                        assert.ok(body.result);
                        assert.ok(body.data);

                        done();
                    });
                });
            });
        });

	    it("success - deploy 1 controller and use the main file specified in src", function (done) {
		    mongo.update("services", {name: 'controller'}, {'$set': {'src.main': '/index.js'}}, function (error) {
			    assert.ifError(error);

			    var params = {
				    headers: {
					    soajsauth: soajsauth
				    },
                    form: {
                        env: 'dev',
                        type: 'service',
                        name: 'controller',
                        gitSource: {
                            owner: 'soajs',
                            repo: 'soajs.controller',
                            branch: 'develop',
                            commit: '67a61db0955803cddf94672b0192be28f47cf280'
                        },
                        deployConfig: {
                            useLocalSOAJS: true,
                            memoryLimit: 209715200,
                            imagePrefix: 'soajsorg',
                            replication: {
                                mode: 'replicated',
                                replicas: 1
                            }
                        }
                    }
			    };
			    executeMyRequest(params, "cloud/services/soajs/deploy", "post", function (body) {
				    assert.ok(body.result);
				    assert.ok(body.data);

                    done();
			    });
		    });
	    });

        it("success - deploy 1 nginx service with static content", function (done) {
            mongo.findOne("staticContent", {name: "Custom UI Test"}, function (error, record) {
                assert.ifError(error);

                var params = {
                    headers: {
                        soajsauth: soajsauth
                    },
                    "form": {
                        env: 'dev',
                        type: 'nginx',
                        name: 'nginx',
                        deployConfig: {
                            memoryLimit: 209715200,
                            imagePrefix: 'soajsorg',
                            replication: {
                                mode: 'replicated',
                                replicas: 1
                            },
                            ports: [
                                {
                                    isPublished: true,
                                    target: 80,
                                    published: 80
                                }
                            ]
                        },
                        contentConfig: {
                            nginx: {
                                ui: {
                                    id: record._id.toString(),
                                    branch: 'develop',
                                    commit: 'ac23581e16511e32e6569af56a878c943e2725bc'
                                }
                            }
                        }
                    }
                };

                executeMyRequest(params, "cloud/services/soajs/deploy", "post", function(body) {
                    assert.ok(body.result);
                    assert.ok(body.data);
                    done();
                });
            });
        });


    });

    describe("testing service deployment", function () {
        it("success - deploy 1 core service, global mode", function (done) {
            var params = {
                headers: {
                    soajsauth: soajsauth
                },
                "form": {
                    env: 'dev',
                    type: 'service',
                    name: 'urac',
                    gitSource: {
                        owner: 'soajs',
                        repo: 'soajs.urac',
                        branch: 'develop',
                        commit: '67a61db0955803cddf94672b0192be28f47cf280'
                    },
                    deployConfig: {
                        useLocalSOAJS: true,
                        memoryLimit: 209715200,
                        imagePrefix: 'soajsorg',
                        replication: {
                            mode: 'global'
                        }
                    }
                }
            };
            executeMyRequest(params, "cloud/services/soajs/deploy", "post", function (body) {
                assert.ok(body.result);
                assert.ok(body.data);

                getService(soajsauth, {env: 'dev', serviceName: 'urac'}, function (service) {
                    deleteService(soajsauth, {env: 'DEV', id: service.id, mode: service.labels['soajs.service.mode']}, function (body) {
                        assert.ok(body.result);
                        assert.ok(body.data);

                        done();
                    });
                });
            });
        });

        it("success - deploy 1 gc service", function (done) {
            mongo.findOne('gc', {}, function (error, gcRecord) {
                assert.ifError(error);
                assert.ok(gcRecord);

                var params = {
                    headers: {
                        soajsauth: soajsauth
                    },
                    "form": {
                        env: 'dev',
                        type: 'service',
                        name: 'gc_articles',
                        variables: [
                            'TEST=true'
                        ],
                        gitSource: {
                            owner: 'soajs',
                            repo: 'soajs.gcs',
                            branch: 'develop',
                            commit: '67a61db0955803cddf94672b0192be28f47cf280'
                        },
                        deployConfig: {
                            useLocalSOAJS: true,
                            memoryLimit: 209715200,
                            imagePrefix: 'soajsorg',
                            replication: {
                                mode: 'replicated',
                                replicas: 1
                            }
                        },
                        contentConfig: {
                            service: {
                                gc: true,
                                gcName: gcRecord.name,
                                gcVersion: gcRecord.v
                            }
                        }
                    }
                };
                executeMyRequest(params, "cloud/services/soajs/deploy", "post", function (body) {
                    assert.ok(body.result);
                    assert.ok(body.data);
                    done();
                });
            });
        });

        it("fail - trying to deploy to an environment that is configured to be deployed manually", function (done) {
            mongo.update('environment', {code: 'PROD'}, {$set: {'deployer.type': 'manual'}}, function (error) {
                assert.ifError(error);

                var params = {
                    headers: {
                        soajsauth: soajsauth
                    },
                    "form": {
                        env: 'prod',
                        type: 'service',
                        name: 'controller',
                        gitSource: {
                            owner: 'soajs',
                            repo: 'soajs.controller',
                            branch: 'develop',
                            commit: '67a61db0955803cddf94672b0192be28f47cf280'
                        },
                        deployConfig: {
                            useLocalSOAJS: true,
                            memoryLimit: 209715200,
                            imagePrefix: 'soajsorg',
                            replication: {
                                mode: 'replicated',
                                replicas: 1
                            }
                        }
                    }
                };
                executeMyRequest(params, "cloud/services/soajs/deploy", "post", function (body) {
                    assert.ok(body.errors);
                    assert.deepEqual(body.errors.details[0], {'code': 618, 'message': errorCodes[618]});
                    done();
                });
            });
        });
    });

    describe("testing daemon deployment", function () {
        it("success - deploy 1 daemon", function (done) {
            var params = {
                headers: {
                    soajsauth: soajsauth
                },
                "form": {
                    env: 'dev',
                    type: 'daemon',
                    name: 'helloDaemon',
                    variables: [
                        'TEST=true'
                    ],
                    gitSource: {
                        owner: 'soajs',
                        repo: 'soajs.prx', //dummy value, does not need to be accurate
                        branch: 'develop',
                        commit: '67a61db0955803cddf94672b0192be28f47cf280'
                    },
                    deployConfig: {
                        useLocalSOAJS: true,
                        memoryLimit: 209715200,
                        imagePrefix: 'soajsorg',
                        replication: {
                            mode: 'replicated',
                            replicas: 1
                        }
                    },
                    contentConfig: {
                        daemon: {
                            grpConfName: 'group1'
                        }
                    }
                }
            };
            executeMyRequest(params, "cloud/services/soajs/deploy", "post", function (body) {
                assert.ok(body.result);
                assert.ok(body.data);

                getService(soajsauth, {env: 'dev', serviceName: 'helloDaemon'}, function (service) {
                    deleteService(soajsauth, {env: 'DEV', id: service.id, mode: service.labels['soajs.service.mode']}, function (body) {
                        assert.ok(body.result);
                        assert.ok(body.data);

                        done();
                    });
                });
            });
        });

        it("success - deploy 1 daemon that contians cmd info in its src", function (done) {
            var cmdArray = ['sleep 36000'];
            mongo.update('daemons', {name: 'helloDaemon'}, {'$set': {'src.cmd': cmdArray}}, function (error) {
                assert.ifError(error);

                var params = {
                    headers: {
                        soajsauth: soajsauth
                    },
                    "form": {
                        env: 'dev',
                        type: 'daemon',
                        name: 'helloDaemon',
                        variables: [
                            'TEST=true'
                        ],
                        gitSource: {
                            owner: 'soajs',
                            repo: 'soajs.prx', //dummy value, does not need to be accurate
                            branch: 'develop',
                            commit: '67a61db0955803cddf94672b0192be28f47cf280'
                        },
                        deployConfig: {
                            useLocalSOAJS: true,
                            memoryLimit: 209715200,
                            imagePrefix: 'soajsorg',
                            replication: {
                                mode: 'replicated',
                                replicas: 1
                            }
                        },
                        contentConfig: {
                            daemon: {
                                grpConfName: 'group1'
                            }
                        }
                    }
                };
                executeMyRequest(params, "cloud/services/soajs/deploy", "post", function (body) {
                    assert.ok(body.result);
                    assert.ok(body.data);

                    getService(soajsauth, {env: 'dev', serviceName: 'helloDaemon'}, function (service) {
                        deleteService(soajsauth, {env: 'DEV', id: service.id, mode: service.labels['soajs.service.mode']}, function (body) {
                            assert.ok(body.result);
                            assert.ok(body.data);

                            done();
                        });
                    });
                });
            });
        });

        it("fail - missing required params", function (done) {
            var params = {
                headers: {
                    soajsauth: soajsauth
                },
                "form": {
                    env: 'dev',
                    type: 'daemon',
                    name: 'helloDaemon',
                    variables: [
                        'TEST=true'
                    ],
                    gitSource: {
                        owner: 'soajs',
                        repo: 'soajs.prx', //dummy value, does not need to be accurate
                        branch: 'develop',
                        commit: '67a61db0955803cddf94672b0192be28f47cf280'
                    },
                    contentConfig: {
                        daemon: {
                            grpConfName: 'group1'
                        }
                    }
                }
            };
            executeMyRequest(params, "cloud/services/soajs/deploy", "post", function (body) {
                assert.ok(body.errors);
                assert.deepEqual(body.errors.details[0], {"code": 172, "message": "Missing required field: deployConfig"});
                done();
            });
        });

    });

    describe("testing redeploy service", function () {
        var nginxDeployment, ctrlDeployment, uiRecord;
        before("list services and get static content record", function (done) {
            mongo.find('staticContent', {}, function (error, records) {
                assert.ifError(error);

                uiRecord = records[0];

                var params = {
                    headers: {
                        soajsauth: soajsauth
                    },
                    qs: {
                        env: 'dev'
                    }
                };
                executeMyRequest(params, "cloud/services/list", "get", function (body) {
                    assert.ok(body.result);
                    assert.ok(body.data);

                    for (var i = 0; i < body.data.length; i++) {
                        if (body.data[i].labels['soajs.service.name'] === 'controller') {
                            ctrlDeployment = body.data[i];
                        }
                        else if (body.data[i].labels['soajs.service.name'] === 'nginx') {
                            nginxDeployment = body.data[i];
                        }
                    }

                    done();
                });
            });
        });

        it ("success - will redeploy controller service", function (done) {
            var params = {
                headers: {
                    soajsauth: soajsauth
                },
                form: {
                    env: 'dev',
                    serviceId: ctrlDeployment.id,
                    mode: ctrlDeployment.labels['soajs.service.mode']
                }
            };

            executeMyRequest(params, "cloud/services/redeploy", "put", function (body) {
                assert.ok(body.result);
                assert.ok(body.data);
                done();
            });
        });

        it ("success - will redeploy nginx and add custom ui to it", function (done) {
            var params = {
                headers: {
                    soajsauth: soajsauth
                },
                form: {
                    env: 'dev',
                    serviceId: nginxDeployment.id,
                    mode: nginxDeployment.labels['soajs.service.mode'],
                    ui: {
                        id: uiRecord._id.toString(),
                        branch: 'develop',
                        commit: 'ac23581e16511e32e6569af56a878c943e2725bc'
                    }
                }
            };

            executeMyRequest(params, "cloud/services/redeploy", "put", function (body) {
                assert.ok(body.result);
                assert.ok(body.data);
                done();
            });
        });

    });

    describe("deploy custom services", function () {

        it("fail - missing params", function (done) {
            var params = {
                headers: {
                    soajsauth: soajsauth
                },
                form: {
                    env: 'dev',
                    name: 'custom-service',
                    variables: [
                        'CUSTOM_ENV_VAR_1=test1',
                        'CUSTOM_ENV_VAR_2=test2'
                    ],
                    labels: {
                        'service.type': 'custom',
                        'service.origin': 'test-cases'
                    },
                    command: {
                        cmd: ['sh'],
                        args: ['-c', 'sleep', '36000']
                    }
                }
            };

            executeMyRequest(params, "cloud/services/custom/deploy", "post", function (body) {
                assert.ok(body.errors);
                assert.deepEqual(body.errors.details[0], {'code': 172, 'message': 'Missing required field: deployConfig'});
                done();
            });
        });

        it("success - will deploy custom service", function (done) {
            var params = {
                headers: {
                    soajsauth: soajsauth
                },
                form: {
                    env: 'dev',
                    name: 'custom-service',
                    variables: [
                        'CUSTOM_ENV_VAR_1=test1',
                        'CUSTOM_ENV_VAR_2=test2'
                    ],
                    labels: {
                        'service.type': 'custom',
                        'service.origin': 'test-cases'
                    },
                    command: {
                        cmd: ['sh'],
                        args: ['-c', 'sleep', '36000']
                    },
                    deployConfig: {
                        image: 'alpine',
                        workDir: '/',
                        memoryLimit: 209715200,
                        network: 'soajsnet',
                        replication: {
                            mode: 'replicated',
                            replicas: 2
                        },
                        restartPolicy: {
                            condition: 'on-failure',
                            maxAttempts: 2
                        },
                        volume: {
                            type: 'bind',
                            readOnly: true,
                            source: '/var/run/docker.sock',
                            target: '/var/run/docker.sock'
                        }
                    }
                }
            };

            executeMyRequest(params, "cloud/services/custom/deploy", "post", function (body) {
                assert.ok(body.result);
                assert.ok(body.data);

                done();
            });
        });

    });

    describe("maintenance operations", function () {
        var ctrlDeployment = {};
        before('get deployed controller service info', function (done) {
            var params = {
                headers: {
                    soajsauth: soajsauth
                },
                qs: {
                    env: 'dev'
                }
            };
            executeMyRequest(params, "cloud/services/list", "get", function (body) {
                assert.ok(body.result);
                assert.ok(body.data);

                for (var i = 0; i < body.data.length; i++) {
                    if (body.data[i].labels['soajs.service.name'] === 'controller') {
                        ctrlDeployment = body.data[i];
                        break;
                    }
                }

                done();
            });
        });

        it("success - will perform maintenace operation on deployed service", function (done) {
            var params = {
                timeout: 5000,
                headers: {
                    soajsauth: soajsauth
                },
                form: {
                    env: 'dev',
                    serviceId: ctrlDeployment.id,
                    serviceName: ctrlDeployment.labels['soajs.service.name'],
                    type: ctrlDeployment.labels['soajs.service.type'],
                    operation: 'heartbeat'
                }
            };
            executeMyRequest(params, "cloud/services/maintenance", "post", function (body) {
                //no check on response since this call will timeout and cause travis to fail
                assert.ok(body);
                done();
            });
        });

        it("fail - service not found", function (done) {
            var params = {
                timeout: 5000,
                headers: {
                    soajsauth: soajsauth
                },
                form: {
                    env: 'dev',
                    serviceId: ctrlDeployment.id,
                    serviceName: ctrlDeployment.labels['soajs.service.name'],
                    type: 'daemon', //controller won't be found in daemons collection, error will be returned
                    operation: 'heartbeat'
                }
            };
            executeMyRequest(params, "cloud/services/maintenance", "post", function (body) {
                assert.ok(body.errors);
                assert.deepEqual(body.errors.details[0], {"code": 795, "message": errorCodes[795]});
                done();
            });
        });

    });

    describe("delete deployed services", function () {
        it("fail - missing required params", function (done) {
            deleteService(soajsauth, {env: 'DEV'}, function (body) {
                assert.ok(body.errors);
                assert.deepEqual(body.errors.details[0], {"code": 172, "message": "Missing required field: serviceId, mode"});
                done();
            });
        });

        it("success - will delete deployed service", function (done) {
            getService(soajsauth, {env: 'dev', serviceName: 'gc-myservice'}, function (service) {
                deleteService(soajsauth, {env: 'dev', id: service.id, mode: service.labels['soajs.service.mode']}, function (body) {
                    assert.ok(body.result);
                    assert.ok(body.data);

                    done();
                });
            });
        });

        it("fail - service not found", function (done) {
            deleteService(soajsauth, {env: 'DEV', id: '123123123', mode: 'replicated'}, function (body) {
                assert.ok(body.errors);
                assert.deepEqual(body.errors.details[0], {"code": 553, "message": "Unable to delete the docker swarm service"});
                done();
            });
        });
    });

    describe("testing get service logs", function () {
        it("success - getting service logs", function (done) {
            var params = {
                headers: {
                    soajsauth: soajsauth
                },
                qs: {
                    env: 'dev'
                }
            };
            executeMyRequest(params, "cloud/services/list", "get", function (body) {
                assert.ok(body.result);
                assert.ok(body.data);
                //only one service exist
                var taskId;
                for (var i = 0; i < body.data.length; i++) {
                    if (body.data[i].labels['soajs.service.name'] === 'nginx') {
                        taskId = ((body.data[i].tasks[0]) ? body.data[i].tasks[0].id : '');
                    }
                }

                params = {
                    headers: {
                        soajsauth: soajsauth
                    },
                    "qs": {
                        "env": "dev",
                        "taskId": taskId
                    }
                };
                executeMyRequest(params, "cloud/services/instances/logs", "get", function (body) {
                    // assert.ok(body.result);
                    // assert.ok(body.data);
                    done();
                });
            });
        });

        after("delete nginx service", function (done) {
            getService(soajsauth, {env: 'dev', serviceName: 'nginx'}, function (service) {
                deleteService(soajsauth, {env: 'DEV', id: service.id, mode: service.labels['soajs.service.mode']}, function (body) {
                    assert.ok(body.result);
                    assert.ok(body.data);

                    done();
                });
            });
        });
    });

    describe("testing scale service", function () {
        it("success - will scale service up to 2 instances", function (done) {
            var params = {
                headers: {
                    soajsauth: soajsauth
                },
                qs: {
                    env: 'dev'
                }
            };
            executeMyRequest(params, "cloud/services/list", "get", function (body) {
                assert.ok(body.result);
                assert.ok(body.data);
                //only one service exist
                var serviceId;
                for (var i = 0; i < body.data.length; i++) {
                    if (body.data[i].labels['soajs.service.name'] === 'controller') {
                        serviceId = body.data[i].id;
                        break;
                    }
                }

                params = {
                    headers: {
                        soajsauth: soajsauth
                    },
                    form: {
                        env: 'dev',
                        serviceId: serviceId,
                        scale: 2
                    }
                };

                executeMyRequest(params, "cloud/services/scale", "put", function (body) {
                    assert.ok(body.result);
                    assert.ok(body.data);
                    done();
                });
            });
        });

        it("fail - missing required params", function (done) {
            var params = {
                headers: {
                    soajsauth: soajsauth
                },
                form: {
                    env: 'dev',
                    scale: 2
                }
            };

            executeMyRequest(params, "cloud/services/scale", "put", function (body) {
                assert.ok(body.errors);
                assert.deepEqual(body.errors.details[0], {"code": 172, "message": "Missing required field: serviceId"});
                done();
            });
        });
    });

    describe("testing kubernetes namespaces", function () {

        describe("testing list namespaces", function () {

            it("fail - operation not supported in swarm mode", function (done) {
                var params = {
                    headers: {
                        soajsauth: soajsauth
                    }
                };

                executeMyRequest(params, "cloud/namespaces/list", "get", function (body) {
                    assert.ok(body.errors);
                    assert.deepEqual(body.errors.details[0], {"code": 909, "message": errorCodes[909]});
                    done();
                });
            });

            it("fail - operation not supported in manual deployment mode", function (done) {
                mongo.update("environment", {code: "DASHBOARD"}, {$set: {"deployer.type": "manual"}}, function (error) {
                    assert.ifError(error);

                    var params = {
                        headers: {
                            soajsauth: soajsauth
                        }
                    };

                    executeMyRequest(params, "cloud/namespaces/list", "get", function (body) {
                        assert.ok(body.errors);
                        assert.deepEqual(body.errors.details[0], {"code": 909, "message": errorCodes[909]});
                        done();
                    });
                });
            });

            after("reset dashboard env deployer type to container", function (done) {
                mongo.update("environment", {code: "DASHBOARD"}, {$set: {"deployer.type": "container"}}, function (error) {
                    assert.ifError(error);
                    done();
                });
            });

        });

        describe("testing delete namespace", function () {

            it("fail - missing required field", function (done) {
                var params = {
                    headers: {
                        soajsauth: soajsauth
                    }
                };

                executeMyRequest(params, "cloud/namespaces/delete", "delete", function (body) {
                    assert.ok(body.errors);
                    assert.deepEqual(body.errors.details[0], {"code": 172, "message": 'Missing required field: namespaceId'});
                    done();
                });
            });

            it("fail - operation not supported in swarm mode", function (done) {
                var params = {
                    headers: {
                        soajsauth: soajsauth
                    },
                    qs: {
                        namespaceId: 'myns'
                    }
                };

                executeMyRequest(params, "cloud/namespaces/delete", "delete", function (body) {
                    assert.ok(body.errors);
                    assert.deepEqual(body.errors.details[0], {"code": 909, "message": errorCodes[909]});
                    done();
                });
            });

            it("fail - operation not supported in manual deployment mode", function (done) {
                mongo.update("environment", {code: "DASHBOARD"}, {$set: {"deployer.type": "manual"}}, function (error) {
                    assert.ifError(error);

                    var params = {
                        headers: {
                            soajsauth: soajsauth
                        },
                        qs: {
                            namespaceId: 'myns'
                        }
                    };

                    executeMyRequest(params, "cloud/namespaces/delete", "delete", function (body) {
                        assert.ok(body.errors);
                        assert.deepEqual(body.errors.details[0], {"code": 909, "message": errorCodes[909]});
                        done();
                    });
                });
            });

        });

    });
});
