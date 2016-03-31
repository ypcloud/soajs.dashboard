"use strict";
var assert = require('assert');
var request = require("request");
var soajs = require('soajs');
var util = require('soajs/lib/utils');
var helper = require("../helper.js");
var dashboard;

var config = helper.requireModule('./config');
var errorCodes = config.errors;

var Mongo = soajs.mongo;
var dbConfig = require("./db.config.test.js");

var dashboardConfig = dbConfig();
dashboardConfig.name = "core_provision";
var mongo = new Mongo(dashboardConfig);

var uracConfig = dbConfig();
uracConfig.name = 'test_urac';
var uracMongo = new Mongo(uracConfig);

var extKey = 'aa39b5490c4a4ed0e56d7ec1232a428f771e8bb83cfcee16de14f735d0f5da587d5968ec4f785e38570902fd24e0b522b46cb171872d1ea038e88328e7d973ff47d9392f72b2d49566209eb88eb60aed8534a965cf30072c39565bd8d72f68ac';
var wrong_Id = '55375fc26aa74450771a1513';
// /tenant/application/acl/get
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
				'Content-Type': 'application/json',
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
		
		if (params.form) {
			options.body = params.form;
		}
		
		if (params.qs) {
			options.qs = params.qs;
		}
		
		request[method](options, function (error, response, body) {
			assert.ifError(error);
			assert.ok(body);
			return cb(null, body);
		});
	}
}

describe("DASHBOARD UNIT Tests", function () {
	var expDateValue = new Date().toISOString();
	var envId;
	describe("environment tests", function () {
		var validEnvRecord = {
			"code": "DEV",
			"port": 8080,
			"domain": "api.myDomain.com",
			"profile": "single",
			"deployer": {
				"type": "manual",
				"selected": "container.dockermachine.local",
				"container": {
					"dockermachine": {
						"local": {
							"host": "localhost",
							"port": 5354,
							"config": {
								"HostConfig": {
									"NetworkMode": "soajsnet"
								},
								"MachineName": "soajs-dev"
							}
						},
						"cloud": {
							"rackspace": {
								"host": "docker.rackspace.com",
								"port": 2376
								//additional info goes here like instances, credentials or keys ....
							}
						}
					},
					"docker": {
						"socket": {
							"socketPath": "/var/run/docker.sock"
						}
					}
				}
			},
			"description": 'this is a dummy description',
			"dbs": {
				"clusters": {
					"cluster1": {
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
						"cluster": "cluster1",
						"name": "core_session",
						"store": {},
						"collection": "sessions",
						"stringify": false,
						"expireAfter": 1209600000
					}
				},
				"databases": {
					"urac": {
						"cluster": "cluster1",
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
						"autoRelaodRegistry": 300000,
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
						"src": true,
						"level": "debug"
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
						"proxy": 'undefined',
						"rolling": false,
						"unset": 'keep',
						"cookie": {
							"path": "/",
							"httpOnly": true,
							"secure": false,
							"domain": "soajs.com",
							"maxAge": null
						},
						"resave": false,
						"saveUninitialized": false
					}
				}
			}
		};
		
		var validCluster = {
			"URLParam": {
				"connectTimeoutMS": 0,
				"socketTimeoutMS": 0,
				"maxPoolSize": 5,
				"wtimeoutMS": 0,
				"slaveOk": true
			},
			"servers": [
				{
					"host": "127.0.0.1",
					"port": 27017
				}
			],
			"extraParam": {
				"db": {
					"native_parser": true
				},
				"server": {
					"auto_reconnect": true
				}
			}
		};
		
		before(function (done) {
			mongo.remove('environment', {}, function (error) {
				assert.ifError(error);
				done();
			});
		});
		
		describe("add environment tests", function () {
			it("success - will add environment", function (done) {
				var params = {
					form: validEnvRecord
				};
				executeMyRequest(params, 'environment/add', 'post', function (body) {
					console.log(JSON.stringify(body));
					assert.ok(body.data);
					done();
				});
			});
			
			it("success - will add environment", function (done) {
				var data2 = util.cloneObj(validEnvRecord);
				data2.code = 'STG';
				data2.services.config.session.proxy = "true";
				var params = {
					form: data2
				};
				executeMyRequest(params, 'environment/add', 'post', function (body) {
					console.log(JSON.stringify(body));
					assert.ok(body.data);
					done();
				});
			});
			
			it("success - will add environment", function (done) {
				var data2 = util.cloneObj(validEnvRecord);
				data2.code = 'PROD';
				data2.deployer.type = "container";
				data2.services.config.session.proxy = "false";
				var params = {
					form: data2
				};
				executeMyRequest(params, 'environment/add', 'post', function (body) {
					console.log(JSON.stringify(body));
					assert.ok(body.data);
					done();
				});
			});
			
			it('fail - missing params', function (done) {
				var params = {
					form: {
						"code": "DEV",
						"description": 'this is a dummy description'
					}
				};
				executeMyRequest(params, 'environment/add', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {
						"code": 172,
						"message": "Missing required field: domain, profile, services, deployer, port"
					});
					
					done();
				});
			});
			
			it('fail - environment exists', function (done) {
				var params = {
					form: validEnvRecord
				};
				executeMyRequest(params, 'environment/add', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {"code": 403, "message": errorCodes[403]});
					
					done();
				});
			});
			
			it('mongo test', function (done) {
				mongo.findOne('environment', {'code': 'DEV'}, function (error, envRecord) {
					assert.ifError(error);
					envId = envRecord._id.toString();
					delete envRecord._id;
					delete envRecord.profile;
					
					var tester = util.cloneObj(validEnvRecord);
					tester.dbs = {clusters: {}, config: {}, databases: {}};
					delete tester.services.config.session.proxy;
					delete tester.profile;
					assert.deepEqual(envRecord, tester);
					done();
				});
			});
		});
		
		describe("update environment tests", function () {
			it("success - will update environment", function (done) {
				var data2 = util.cloneObj(validEnvRecord);
				data2.services.config.session.proxy = "true";
				data2.deployer.type = "container";
				var params = {
					qs: {"id": envId},
					form: {
						"domain": "api.myDomain.com",
						"profile": data2.profile,
						"port": data2.port,
						"deployer": data2.deployer,
						"description": 'this is a dummy updated description',
						"services": data2.services
					}
				};
				executeMyRequest(params, 'environment/update', 'post', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			
			it("success - will update environment", function (done) {
				var data2 = util.cloneObj(validEnvRecord);
				data2.services.config.session.proxy = "false";
				var params = {
					qs: {"id": envId},
					form: {
						"domain": "api.myDomain.com",
						"profile": data2.profile,
						"port": data2.port,
						"deployer": data2.deployer,
						"description": 'this is a dummy updated description',
						"services": data2.services
					}
				};
				executeMyRequest(params, 'environment/update', 'post', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			
			it("success - will update environment", function (done) {
				var params = {
					qs: {"id": envId},
					form: {
						"domain": "api.myDomain.com",
						"profile": validEnvRecord.profile,
						"port": validEnvRecord.port,
						"deployer": validEnvRecord.deployer,
						"description": 'this is a dummy updated description',
						"services": validEnvRecord.services
					}
				};
				executeMyRequest(params, 'environment/update', 'post', function (body) {
					assert.ok(body.data);
					done();
				});
				
			});
			
			it('fail - missing params', function (done) {
				var params = {
					qs: {"id": envId},
					form: {
						"description": 'this is a dummy description'
					}
				};
				executeMyRequest(params, 'environment/update', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {
						"code": 172,
						"message": "Missing required field: domain, profile, services, deployer, port"
					});
					done();
				});
			});
			
			it('fail - invalid environment id provided', function (done) {
				var params = {
					qs: {"id": "aaaabbbbccc"},
					form: {
						"domain": validEnvRecord.profile,
						"profile": validEnvRecord.profile,
						"port": validEnvRecord.port,
						"deployer": validEnvRecord.deployer,
						"description": 'this is a dummy description',
						"services": validEnvRecord.services
					}
				};
				executeMyRequest(params, 'environment/update', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {"code": 405, "message": errorCodes[405]});
					done();
				});
			});
			
			it('mongo test', function (done) {
				mongo.findOne('environment', {'code': 'DEV'}, function (error, envRecord) {
					assert.ifError(error);
					envId = envRecord._id.toString();
					delete envRecord._id;
					delete envRecord.profile;
					var tester = util.cloneObj(validEnvRecord);
					tester.dbs = {clusters: {}, config: {}, databases: {}};
					tester.description = "this is a dummy updated description";
					delete tester.services.config.session.proxy;
					delete tester.profile;
					assert.deepEqual(envRecord.services, tester.services);
					done();
				});
				
			});
		});
		
		describe("delete environment tests", function () {
			it('fail - missing params', function (done) {
				var params = {
					qs: {}
				};
				executeMyRequest(params, 'environment/delete', 'get', function (body) {
					assert.deepEqual(body.errors.details[0], {"code": 172, "message": "Missing required field: id"});
					done();
				});
			});
			
			it('fail - invalid environment id provided', function (done) {
				var params = {
					qs: {'id': 'aaaabbcdddd'}
				};
				executeMyRequest(params, 'environment/delete', 'get', function (body) {
					assert.deepEqual(body.errors.details[0], {"code": 405, "message": errorCodes[405]});
					done();
				});
			});
			
			it("success - will delete environment", function (done) {
				var params = {
					qs: {'id': envId}
				};
				executeMyRequest(params, 'environment/delete', 'get', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			
			it('mongo test', function (done) {
				mongo.find('environment', {}, {}, function (error, records) {
					assert.ifError(error);
					assert.ok(records);
					assert.equal(records.length, 2);
					done();
				});
			});
		});
		
		describe("list environment tests", function () {
			it("success - will get empty list", function (done) {
				executeMyRequest({}, 'environment/list', 'get', function (body) {
					assert.ok(body.data);
					assert.equal(body.data.length, 2);
					done();
				});
			});
			it("success - will add environment", function (done) {
				var params = {
					form: validEnvRecord
				};
				executeMyRequest(params, 'environment/add', 'post', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			it("success - will list environment", function (done) {
				executeMyRequest({}, 'environment/list', 'get', function (body) {
					assert.ok(body.data);
					assert.equal(body.data.length, 3);
					
					body.data.forEach(function (oneEnv) {
						if (oneEnv.code === 'DEV') {
							delete oneEnv._id;
							delete oneEnv.profile;
							var tester = util.cloneObj(validEnvRecord);
							tester.dbs = {clusters: {}, config: {}, databases: {}};
							delete tester.services.config.session.proxy;
							delete tester.profile;
							assert.deepEqual(oneEnv, tester);
						}
					});
					done();
				});
			});
		});
		
		
		describe("add environment clusters", function () {
			it("success - will add new cluster", function (done) {
				var params = {
					qs: {
						env: "dev",
						"name": "cluster1"
					},
					form: {
						'cluster': validCluster
					}
				};
				executeMyRequest(params, 'environment/clusters/add', 'post', function (body) {
					console.log(JSON.stringify(body));
					assert.ok(body.data);
					done();
				});
			});
			
			it('fail - missing parameters', function (done) {
				var params = {
					qs: {
						'env': 'dev',
						'name': 'cluster1'
					},
					form: {
						//"cluster": {}
					}
				};
				executeMyRequest(params, 'environment/clusters/add', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {
						"code": 172,
						"message": "Missing required field: cluster"
					});
					
					done();
				});
			});
			
			it('fail - cluster exists', function (done) {
				var params = {
					qs: {
						env: "dev",
						"name": "cluster1"
					},
					form: {
						'cluster': validCluster
					}
				};
				executeMyRequest(params, 'environment/clusters/add', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {
						"code": 504,
						"message": "Environment cluster already exists"
					});
					done();
				});
			});
			
			it('mongo - testing db', function (done) {
				mongo.findOne('environment', {'code': 'DEV'}, function (error, envRecord) {
					assert.ifError(error);
					assert.deepEqual(envRecord.dbs.clusters['cluster1'], validCluster);
					done();
				});
			});
		});
		
		describe("update environment clusters", function () {
			it("success - will update cluster", function (done) {
				var params = {
					qs: {
						env: "dev",
						"name": "cluster1"
					},
					form: {
						'cluster': validCluster
					}
				};
				executeMyRequest(params, 'environment/clusters/update', 'post', function (body) {
					console.log(JSON.stringify(body));
					assert.ok(body.data);
					done();
				});
			});
			
			it('fail - missing parameters', function (done) {
				var params = {
					qs: {
						'env': 'dev',
						'name': 'cluster1'
					},
					form: {
						//"cluster": {}
					}
				};
				executeMyRequest(params, 'environment/clusters/update', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {
						"code": 172,
						"message": "Missing required field: cluster"
					});
					
					done();
				});
			});
			
			it('fail - cluster does not exists', function (done) {
				var params = {
					qs: {
						env: "dev",
						"name": "cluster2"
					},
					form: {
						'cluster': validCluster
					}
				};
				executeMyRequest(params, 'environment/clusters/update', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {"code": 502, "message": "Invalid cluster name provided"});
					done();
				});
			});
			
			it('mongo - testing db', function (done) {
				mongo.findOne('environment', {'code': 'DEV'}, function (error, envRecord) {
					assert.ifError(error);
					assert.deepEqual(envRecord.dbs.clusters['cluster1'], validCluster);
					done();
				});
			});
		});
		
		describe("delete environment clusters", function () {
			it('fail - missing params', function (done) {
				var params = {
					qs: {
						'env': 'dev'
					}
				};
				executeMyRequest(params, 'environment/clusters/delete', 'get', function (body) {
					assert.deepEqual(body.errors.details[0], {"code": 172, "message": "Missing required field: name"});
					done();
				});
			});
			
			it('fail - invalid environment id provided', function (done) {
				var params = {
					qs: {
						'env': 'dev',
						'name': 'invalid'
					}
				};
				executeMyRequest(params, 'environment/clusters/delete', 'get', function (body) {
					console.log(JSON.stringify(body));
					assert.deepEqual(body.errors.details[0], {"code": 508, "message": errorCodes[508]});
					done();
				});
			});
			
			it("success - will delete environment", function (done) {
				var params = {
					qs: {
						'env': 'dev',
						'name': 'cluster1'
					}
				};
				executeMyRequest(params, 'environment/clusters/delete', 'get', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			
			it('mongo test', function (done) {
				mongo.find('environment', {}, {}, function (error, records) {
					assert.ifError(error);
					assert.ok(records);
					assert.equal(JSON.stringify(records[0].dbs.clusters), '{}');
					done();
				});
			});
		});
		
		describe("list environment clusters", function () {
			it('success - returns empty list', function (done) {
				var params = {
					qs: {'env': 'dev'}
				};
				executeMyRequest(params, 'environment/clusters/list', 'get', function (body) {
					assert.ok(body.data);
					assert.equal(Object.keys(body.data).length, 0);
					done();
				});
			});
			
			it('success - adds new cluster', function (done) {
				var params = {
					qs: {
						env: "dev",
						"name": "cluster1"
					},
					form: {
						'cluster': validCluster
					}
				};
				executeMyRequest(params, 'environment/clusters/add', 'post', function (body) {
					console.log(JSON.stringify(body));
					assert.ok(body.data);
					done();
				});
			});
			
			it('success - returns one entry in list', function (done) {
				var params = {
					qs: {'env': 'dev'}
				};
				executeMyRequest(params, 'environment/clusters/list', 'get', function (body) {
					assert.ok(body.data);
					assert.equal(Object.keys(body.data).length, 1);
					done();
				});
			});
		});
		
		
		describe("add environment db", function () {
			it("success - will add a db", function (done) {
				var params = {
					qs: {
						env: "dev"
					},
					form: {
						'name': 'urac',
						'tenantSpecific': true,
						'cluster': 'cluster1'
					}
				};
				executeMyRequest(params, 'environment/dbs/add', 'post', function (body) {
					console.log(JSON.stringify(body));
					assert.ok(body.data);
					done();
				});
			});
			
			it('success - will add session db', function (done) {
				var params = {
					qs: {
						env: "dev"
					},
					form: {
						'name': 'session',
						'cluster': 'cluster1',
						'sessionInfo': {
							"cluster": "cluster1",
							"dbName": "core_session",
							'store': {},
							"collection": "sessions",
							'stringify': false,
							'expireAfter': 1000 * 60 * 60 * 24 * 14 // 2 weeks
						}
					}
				};
				executeMyRequest(params, 'environment/dbs/add', 'post', function (body) {
					console.log(JSON.stringify(body));
					assert.ok(body.data);
					done();
				});
			});
			
			it("success - wil add a db and set tenantSpecific to false by default", function (done) {
				var params = {
					qs: {
						env: "dev"
					},
					form: {
						'name': 'testDb',
						'cluster': 'cluster1'
					}
				};
				executeMyRequest(params, 'environment/dbs/add', 'post', function (body) {
					console.log(JSON.stringify(body));
					assert.ok(body.data);
					
					mongo.findOne("environment", {'code': 'DEV'}, function (error, envRecord) {
						assert.ifError(error);
						assert.ok(envRecord);
						assert.ok(envRecord.dbs.databases['testDb']);
						assert.equal(envRecord.dbs.databases['testDb'].tenantSpecific, false);
						
						//clean db record, remove testDb
						delete envRecord.dbs.databases['testDb'];
						mongo.save("environment", envRecord, function (error, result) {
							assert.ifError(error);
							assert.ok(result);
							done();
						});
					});
				});
			});
			
			it('fail - missing params', function (done) {
				var params = {
					qs: {
						env: "dev"
					},
					form: {
						'cluster': 'cluster1'
					}
				};
				executeMyRequest(params, 'environment/dbs/add', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {"code": 172, "message": "Missing required field: name"});
					done();
				});
			});
			
			it('fail - invalid cluster provided', function (done) {
				var params = {
					qs: {
						env: "dev"
					},
					form: {
						'name': 'urac',
						'tenantSpecific': true,
						'cluster': 'invalid'
					}
				};
				executeMyRequest(params, 'environment/dbs/add', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {"code": 502, "message": "Invalid cluster name provided"});
					done();
				});
			});
			
			it('fail - invalid session params', function (done) {
				var params = {
					qs: {
						env: "dev"
					},
					form: {
						'name': 'session',
						'cluster': 'cluster1'
					}
				};
				executeMyRequest(params, 'environment/dbs/add', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {
						"code": 507,
						"message": "Invalid db Information provided for session database"
					});
					done();
				});
			});
			
			it('fail - database already exist', function (done) {
				var params = {
					qs: {
						env: "dev"
					},
					form: {
						'name': 'urac',
						'tenantSpecific': true,
						'cluster': 'cluster1'
					}
				};
				executeMyRequest(params, 'environment/dbs/add', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {
						"code": 509,
						"message": "environment database already exist"
					});
					done();
				});
			});
			
			it('fail - session already exist', function (done) {
				var params = {
					qs: {
						env: "dev"
					},
					form: {
						'name': 'session',
						'cluster': 'cluster1',
						'sessionInfo': {
							"cluster": "cluster1",
							"dbName": "core_session",
							'store': {},
							"collection": "sessions",
							'stringify': false,
							'expireAfter': 1000 * 60 * 60 * 24 * 14 // 2 weeks
						}
					}
				};
				executeMyRequest(params, 'environment/dbs/add', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {
						"code": 510,
						"message": "environment session database already exist"
					});
					done();
				});
			});
			
			it('mongo - testing database content', function (done) {
				mongo.find('environment', {'code': 'DEV'}, {}, function (error, records) {
					assert.ifError(error);
					assert.ok(records);
					assert.ok(records[0].dbs.databases.urac);
					assert.ok(records[0].dbs.config.session);
					done();
				});
			});
		});
		
		describe("update environment db", function () {
			it("success - will update a db and set tenantSpecific to false by default", function (done) {
				var params = {
					qs: {
						env: "dev"
					},
					form: {
						'name': 'urac',
						'cluster': 'cluster1'
					}
				};
				executeMyRequest(params, 'environment/dbs/update', 'post', function (body) {
					console.log(JSON.stringify(body));
					assert.ok(body.data);
					done();
				});
			});
			
			it("success - will update a db", function (done) {
				var params = {
					qs: {
						env: "dev"
					},
					form: {
						'name': 'urac',
						'tenantSpecific': true,
						'cluster': 'cluster1'
					}
				};
				executeMyRequest(params, 'environment/dbs/update', 'post', function (body) {
					console.log(JSON.stringify(body));
					assert.ok(body.data);
					done();
				});
			});
			
			it('success - will update session db', function (done) {
				var params = {
					qs: {
						env: "dev"
					},
					form: {
						'name': 'session',
						'cluster': 'cluster1',
						'sessionInfo': {
							"cluster": "cluster1",
							"dbName": "core_session",
							'store': {},
							"collection": "sessions",
							'stringify': false,
							'expireAfter': 1000 * 60 * 60 * 24 * 14 // 2 weeks
						}
					}
				};
				executeMyRequest(params, 'environment/dbs/update', 'post', function (body) {
					console.log(JSON.stringify(body));
					assert.ok(body.data);
					done();
				});
			});
			
			it('fail - missing params', function (done) {
				var params = {
					qs: {
						env: "dev"
					},
					form: {
						'cluster': 'cluster1'
					}
				};
				executeMyRequest(params, 'environment/dbs/update', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {"code": 172, "message": "Missing required field: name"});
					done();
				});
			});
			
			it('fail - invalid cluster provided', function (done) {
				var params = {
					qs: {
						env: "dev"
					},
					form: {
						'name': 'urac',
						'tenantSpecific': true,
						'cluster': 'invalid'
					}
				};
				executeMyRequest(params, 'environment/dbs/update', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {"code": 502, "message": "Invalid cluster name provided"});
					done();
				});
			});
			
			it('fail - invalid session params', function (done) {
				var params = {
					qs: {
						env: "dev"
					},
					form: {
						'name': 'session',
						'cluster': 'cluster1'
					}
				};
				executeMyRequest(params, 'environment/dbs/update', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {
						"code": 507,
						"message": "Invalid db Information provided for session database"
					});
					done();
				});
			});
			
			it('fail - database does not exist', function (done) {
				var params = {
					qs: {
						env: "dev"
					},
					form: {
						'name': 'invalid',
						'tenantSpecific': true,
						'cluster': 'cluster1'
					}
				};
				executeMyRequest(params, 'environment/dbs/update', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {
						"code": 512,
						"message": "environment database does not exist"
					});
					done();
				});
			});
			
			it('fail - session does not exist', function (done) {
				var params = {
					qs: {
						env: "dev"
					},
					form: {
						'name': 'session',
						'cluster': 'cluster1',
						'sessionInfo': {
							"cluster": "cluster1",
							"dbName": "core_session",
							'store': {},
							"collection": "sessions",
							'stringify': false,
							'expireAfter': 1000 * 60 * 60 * 24 * 14 // 2 weeks
						}
					}
				};
				var tmp = {};
				mongo.findOne('environment', {'code': 'DEV'}, function (error, record) {
					assert.ifError(error);
					tmp = util.cloneObj(record.dbs.config.session);
					delete record.dbs.config.session;
					
					mongo.save('environment', record, function (error) {
						assert.ifError(error);
						executeMyRequest(params, 'environment/dbs/update', 'post', function (body) {
							assert.deepEqual(body.errors.details[0], {
								"code": 511,
								"message": "environment session database does not exist"
							});
							
							record.dbs.config.session = tmp;
							mongo.save('environment', record, function (error) {
								assert.ifError(error);
								done();
							});
						});
					});
				});
			});
			
			it('mongo - testing database content', function (done) {
				mongo.find('environment', {'code': 'DEV'}, {}, function (error, records) {
					assert.ifError(error);
					assert.ok(records);
					assert.ok(records[0].dbs.databases.urac);
					assert.ok(records[0].dbs.config.session);
					done();
				});
			});
		});
		
		describe("delete environment db", function () {
			it('fail - missing params', function (done) {
				var params = {
					qs: {
						env: "dev"
					}
				};
				executeMyRequest(params, 'environment/dbs/delete', 'get', function (body) {
					assert.deepEqual(body.errors.details[0], {"code": 172, "message": "Missing required field: name"});
					done();
				});
			});
			
			it('fail - invalid database name', function (done) {
				var params = {
					qs: {
						"env": "dev",
						"name": "invalid"
					}
				};
				executeMyRequest(params, 'environment/dbs/delete', 'get', function (body) {
					assert.deepEqual(body.errors.details[0], {
						"code": 512,
						"message": "environment database does not exist"
					});
					done();
				});
			});
			
			it('fail - session does not exist', function (done) {
				var params = {
					qs: {
						"env": "dev",
						"name": "session"
					}
				};
				var tmp = {};
				mongo.findOne('environment', {'code': 'DEV'}, function (error, record) {
					assert.ifError(error);
					tmp = util.cloneObj(record.dbs.config.session);
					delete record.dbs.config.session;
					
					mongo.save('environment', record, function (error) {
						assert.ifError(error);
						
						executeMyRequest(params, 'environment/dbs/delete', 'get', function (body) {
							assert.deepEqual(body.errors.details[0], {
								"code": 511,
								"message": "environment session database does not exist"
							});
							
							record.dbs.config.session = tmp;
							mongo.save('environment', record, function (error) {
								assert.ifError(error);
								done();
							});
						});
					});
				});
			});
			
			it('success - delete database', function (done) {
				var params = {
					qs: {
						"env": "dev",
						"name": "urac"
					}
				};
				executeMyRequest(params, 'environment/dbs/delete', 'get', function (body) {
					console.log(JSON.stringify(body));
					assert.ok(body.data);
					done();
				});
			});
			
			it('success - delete session', function (done) {
				var params = {
					qs: {
						"env": "dev",
						"name": "session"
					}
				};
				executeMyRequest(params, 'environment/dbs/delete', 'get', function (body) {
					console.log(JSON.stringify(body));
					assert.ok(body.data);
					done();
				});
			});
			
			it('mongo - testing database', function (done) {
				mongo.findOne('environment', {'code': "DEV"}, function (error, record) {
					assert.ifError(error);
					assert.ok(record);
					assert.equal(JSON.stringify(record.dbs.databases), '{}');
					assert.equal(JSON.stringify(record.dbs.config), '{}');
					done();
				});
			});
		});
		
		describe("list environment dbs", function () {
			it('success - no session and no databases', function (done) {
				var params = {
					qs: {'env': 'dev'}
				};
				executeMyRequest(params, 'environment/dbs/list', 'get', function (body) {
					assert.ok(body.data);
					assert.equal(JSON.stringify(body.data.databases), '{}');
					assert.equal(JSON.stringify(body.data.config), '{}');
					done();
				});
			});
			
			it('success - add session db', function (done) {
				var params = {
					qs: {
						env: "dev"
					},
					form: {
						'name': 'session',
						'cluster': 'cluster1',
						'sessionInfo': {
							"cluster": "cluster1",
							"dbName": "core_session",
							'store': {},
							"collection": "sessions",
							'stringify': false,
							'expireAfter': 1000 * 60 * 60 * 24 * 14 // 2 weeks
						}
					}
				};
				executeMyRequest(params, 'environment/dbs/add', 'post', function (body) {
					console.log(JSON.stringify(body));
					assert.ok(body.data);
					done();
				});
			});
			
			it('success - add urac db', function (done) {
				var params = {
					qs: {
						env: "dev"
					},
					form: {
						'name': 'urac',
						'tenantSpecific': true,
						'cluster': 'cluster1'
					}
				};
				executeMyRequest(params, 'environment/dbs/add', 'post', function (body) {
					console.log(JSON.stringify(body));
					assert.ok(body.data);
					done();
				});
			});
			
			it('success - yes session and yes databases', function (done) {
				var params = {
					qs: {'env': 'dev'}
				};
				executeMyRequest(params, 'environment/dbs/list', 'get', function (body) {
					assert.ok(body.data);
					assert.deepEqual(body.data.databases, {
						'urac': {
							'cluster': 'cluster1',
							'tenantSpecific': true
						}
					});
					assert.deepEqual(body.data.config, {
						'session': {
							"cluster": "cluster1",
							"name": "core_session",
							'store': {},
							"collection": "sessions",
							'stringify': false,
							'expireAfter': 1000 * 60 * 60 * 24 * 14
						}
					});
					done();
				});
			});
		});
		
		
		describe("update environment db prefix", function () {
			it("success - add db prefix", function (done) {
				var params = {
					qs: {
						env: "dev"
					},
					form: {
						'prefix': 'soajs_'
					}
				};
				executeMyRequest(params, 'environment/dbs/updatePrefix', 'post', function (body) {
					console.log(JSON.stringify(body));
					assert.ok(body.data);
					
					mongo.findOne('environment', {'code': 'DEV'}, function (error, envRecord) {
						assert.ifError(error);
						assert.equal(envRecord.dbs.config.prefix, 'soajs_');
						done();
					});
				});
			});
			
			it("success - empty db prefix", function (done) {
				var params = {
					qs: {
						env: "dev"
					},
					form: {
						'prefix': ''
					}
				};
				executeMyRequest(params, 'environment/dbs/updatePrefix', 'post', function (body) {
					console.log(JSON.stringify(body));
					assert.ok(body.data);
					
					mongo.findOne('environment', {'code': 'DEV'}, function (error, envRecord) {
						assert.ifError(error);
						assert.equal(envRecord.dbs.config.prefix, '');
						done();
					});
				});
			});
		});
		
	});
	
	describe("products tests", function () {
		var productId;
		
		describe("product", function () {
			before(function (done) {
				mongo.remove('products', {'code': 'TPROD'}, function (error) {
					assert.ifError(error);
					done();
				});
			});
			describe("add product tests", function () {
				it("success - will add product", function (done) {
					var params = {
						form: {
							"code": "TPROD",
							"name": 'test product',
							"description": 'this is a dummy description'
						}
					};
					executeMyRequest(params, 'product/add', 'post', function (body) {
						assert.ok(body.data);
						done();
					});
				});
				
				it('fail - missing params', function (done) {
					var params = {
						form: {
							"name": "test product",
							"description": 'this is a dummy description'
						}
					};
					executeMyRequest(params, 'product/add', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: code"
						});
						
						done();
					});
				});
				
				it('fail - product exists', function (done) {
					var params = {
						form: {
							"code": "TPROD",
							"name": 'test product',
							"description": 'this is a dummy description'
						}
					};
					executeMyRequest(params, 'product/add', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {"code": 413, "message": errorCodes[413]});
						
						done();
					});
				});
				// product/get
				
				it('mongo test', function (done) {
					mongo.findOne('products', {'code': 'TPROD'}, function (error, productRecord) {
						assert.ifError(error);
						productId = productRecord._id.toString();
						delete productRecord._id;
						assert.deepEqual(productRecord, {
							"code": "TPROD",
							"name": "test product",
							"description": "this is a dummy description",
							"packages": []
						});
						done();
					});
					
				});
			});
			
			describe("update product tests", function () {
				it("success - will update product", function (done) {
					var params = {
						qs: {'id': productId},
						form: {
							"id": productId,
							"description": 'this is a dummy updated description',
							"name": "test product updated"
						}
					};
					executeMyRequest(params, 'product/update', 'post', function (body) {
						assert.ok(body.data);
						done();
					});
				});
				
				it('success - product/get', function (done) {
					var params = {
						qs: {
							"id": productId
						}
					};
					executeMyRequest(params, 'product/get', 'get', function (body) {
						//assert.deepEqual(body.errors.details[0], {"code": 413, "message": errorCodes[413]});
						console.log(body);
						done();
					});
				});
				
				it('fail - missing params', function (done) {
					var params = {
						qs: {'id': productId},
						form: {
							"description": 'this is a dummy description'
						}
					};
					executeMyRequest(params, 'product/update', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: name"
						});
						
						done();
					});
				});
				
				it('fail - invalid product id provided', function (done) {
					var params = {
						qs: {'id': 'aaaabbbbccccdddd'},
						form: {
							"description": 'this is a dummy description',
							"name": 'test product updated'
						}
					};
					executeMyRequest(params, 'product/update', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {"code": 409, "message": errorCodes[409]});
						
						done();
					});
				});
				
				it('mongo test', function (done) {
					mongo.find('products', {}, {}, function (error, records) {
						assert.ifError(error);
						assert.ok(records);
						assert.equal(records.length, 2);
						delete records[1]._id;
						assert.deepEqual(records[1], {
							"code": "TPROD",
							"name": "test product updated",
							"description": "this is a dummy updated description",
							"packages": []
						});
						done();
					});
				});
			});
			
			describe("delete product tests", function () {
				var tProd2;
				it('fail - missing params', function (done) {
					var params = {
						qs: {}
					};
					executeMyRequest(params, 'product/delete', 'get', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: id"
						});
						
						done();
					});
				});
				
				it('fail - invalid product id provided', function (done) {
					var params = {
						qs: {'id': "aaaabbbbccccdddd"}
					};
					executeMyRequest(params, 'product/delete', 'get', function (body) {
						assert.deepEqual(body.errors.details[0], {"code": 409, "message": errorCodes[409]});
						
						done();
					});
				});
				
				it("success - will add product again", function (done) {
					var params = {
						form: {
							"code": "TPRO2",
							"name": 'test product 2',
							"description": 'this is a dummy description'
						}
					};
					executeMyRequest(params, 'product/add', 'post', function (body) {
						assert.ok(body.data);
						mongo.findOne('products', {'code': 'TPRO2'}, function (error, productRecord) {
							assert.ifError(error);
							tProd2 = productRecord._id.toString();
							done();
						});
					});
				});
				
				it("success - will delete product", function (done) {
					var params = {
						qs: {'id': tProd2}
					};
					executeMyRequest(params, 'product/delete', 'get', function (body) {
						assert.ok(body.data);
						done();
					});
				});
				
				it('mongo test', function (done) {
					mongo.find('products', {}, {}, function (error, records) {
						assert.ifError(error);
						assert.ok(records);
						assert.equal(records.length, 2);
						done();
					});
				});
			});
			
			describe("list product tests", function () {
				it("success - will list product", function (done) {
					executeMyRequest({}, 'product/list', 'get', function (body) {
						assert.ok(body.data);
						assert.equal(body.data.length, 2);
						
						productId = body.data[1]._id.toString();
						delete body.data[1]._id;
						assert.deepEqual(body.data[1], {
							"code": "TPROD",
							"name": "test product updated",
							"description": "this is a dummy updated description",
							"packages": []
						});
						done();
					});
				});
			});
		});
		
		describe("package", function () {
			describe("add package tests", function () {
				it("fail - invalid env code in acl", function (done) {
					var params = {
						qs: {'id': productId},
						form: {
							"code": "BASIC",
							"name": "basic package",
							"description": 'this is a dummy description',
							"_TTL": '12',
							"acl": {
								"inv": {
									"urac": {
										'access': false,
										'apis': {
											'/account/changeEmail': {
												'access': true
											}
										}
									}
								}
							}
						}
					};
					executeMyRequest(params, 'product/packages/add', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 405,
							"message": "Invalid environment id provided"
						});
						done();
					});
				});
				
				it("success - will add package", function (done) {
					var params = {
						qs: {'id': productId},
						form: {
							"code": "BASIC",
							"name": "basic package",
							"description": 'this is a dummy description',
							"_TTL": '12',
							"acl": {
								"dev": {
									"urac": {
										'access': false,
										'apis': {
											'/account/changeEmail': {
												'access': true
											}
										}
									}
								}
							}
						}
					};
					executeMyRequest(params, 'product/packages/add', 'post', function (body) {
						assert.ok(body.data);
						mongo.findOne('products', {'code': 'TPROD'}, function (error, record) {
							assert.ifError(error);
							delete record._id;
							assert.deepEqual(record.packages[0], {
								"code": "TPROD_BASIC",
								"name": "basic package",
								"description": "this is a dummy description",
								"_TTL": 12 * 3600 * 1000,
								"acl": {
									"dev": {
										"urac": {
											'access': false,
											'apis': {
												'/account/changeEmail': {
													'access': true
												}
											}
										}
									}
								}
							});
							done();
							
						});
					});
				});
				
				it("success - will add another package", function (done) {
					var params = {
						qs: {'id': productId},
						form: {
							"code": "PACKA",
							"name": "some package",
							"description": 'this is a dummy description',
							"_TTL": '12',
							"acl": {
								"dev": {
									"urac": {
										'access': false,
										'apis': {
											'/account/changeEmail': {
												'access': true
											}
										}
									}
								}
							}
						}
					};
					executeMyRequest(params, 'product/packages/add', 'post', function (body) {
						assert.ok(body.data);
						mongo.findOne('products', {'code': 'TPROD'}, function (error, record) {
							assert.ifError(error);
							delete record._id;
							assert.deepEqual(record.packages[1], {
								"code": "TPROD_PACKA",
								"name": "some package",
								"description": "this is a dummy description",
								"_TTL": 12 * 3600 * 1000,
								"acl": {
									"dev": {
										"urac": {
											'access': false,
											'apis': {
												'/account/changeEmail': {
													'access': true
												}
											}
										}
									}
								}
							});
							done();
							
						});
					});
				});
				
				it('fail - missing params', function (done) {
					var params = {
						qs: {'id': productId},
						form: {
							"name": "basic package",
							"description": 'this is a dummy description',
							"_TTL": '12',
							"acl": {
								"urac": {
									'access': false,
									'apis': {
										'/account/changeEmail': {
											'access': true
										}
									}
								}
							}
						}
					};
					executeMyRequest(params, 'product/packages/add', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: code"
						});
						
						done();
					});
				});
				it("fail - wrong product id", function (done) {
					var params = {
						qs: {'id': wrong_Id},
						form: {
							"name": "basic package",
							"code": "BSIC",
							"description": 'this is a dummy description',
							"_TTL": '12',
							"acl": {}
						}
					};
					executeMyRequest(params, 'product/packages/add', 'post', function (body) {
						assert.ok(body.errors);
						console.log(body.errors);
						done();
					});
				});
				
				it('fail - package exists', function (done) {
					var params = {
						qs: {'id': productId},
						form: {
							"code": "BASIC",
							"name": "basic package",
							"description": 'this is a dummy description',
							"_TTL": '12',
							"acl": {
								"dev": {
									"urac": {
										'access': false,
										'apis': {
											'/account/changeEmail': {
												'access': true
											}
										}
									}
								}
							}
						}
					};
					executeMyRequest(params, 'product/packages/add', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {"code": 418, "message": errorCodes[418]});
						
						done();
					});
				});
				
			});
			
			describe("get prod package tests", function () {
				it('success - product/packages/get', function (done) {
					var params = {
						qs: {
							"productCode": "TPROD",
							"packageCode": "TPROD_BASIC"
						}
					};
					executeMyRequest(params, 'product/packages/get', 'get', function (body) {
						//assert.deepEqual(body.errors.details[0], {"code": 413, "message": errorCodes[413]});
						console.log(JSON.stringify(body));
						assert.ok(body.data);
						assert.ok(body.data.code);
						done();
					});
				});
				it('fail - product/packages/get - wrong package Code', function (done) {
					var params = {
						qs: {
							"productCode": "TPROD",
							"packageCode": "TPROD_BASC"
						}
					};
					executeMyRequest(params, 'product/packages/get', 'get', function (body) {
						console.log(JSON.stringify(body));
						assert.deepEqual(body.errors.details[0], {"code": 461, "message": errorCodes[461]});
						done();
					});
				});
				it('fail - product/packages/get - wrong product Code', function (done) {
					var params = {
						qs: {
							"productCode": "TROD",
							"packageCode": "TPROD_BASC"
						}
					};
					executeMyRequest(params, 'product/packages/get', 'get', function (body) {
						console.log(JSON.stringify(body));
						assert.deepEqual(body.errors.details[0], {"code": 460, "message": errorCodes[460]});
						done();
					});
				});
			});
			
			describe("update package tests", function () {
				it('fail - invalid env code in acl', function (done) {
					var params = {
						qs: {'id': productId, "code": "BASIC"},
						form: {
							"name": "basic package 2",
							"description": 'this is a dummy updated description',
							"_TTL": '24',
							"acl": {
								"inv": {
									"urac": {
										'access': false,
										'apis': {
											'/account/changeEmail': {
												'access': true
											}
										}
									}
								}
							}
						}
					};
					executeMyRequest(params, 'product/packages/update', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 405,
							"message": "Invalid environment id provided"
						});
						done();
					});
				});
				
				it("success - will update package", function (done) {
					var params = {
						qs: {'id': productId, "code": "BASIC"},
						form: {
							"name": "basic package 2",
							"description": 'this is a dummy updated description',
							"_TTL": '24',
							"acl": {
								"dev": {
									"urac": {
										'access': false,
										'apis': {
											'/account/changeEmail': {
												'access': true
											}
										}
									}
								}
							}
						}
					};
					executeMyRequest(params, 'product/packages/update', 'post', function (body) {
						assert.ok(body.data);
						
						mongo.findOne('products', {'code': 'TPROD'}, function (error, record) {
							assert.ifError(error);
							delete record._id;
							assert.deepEqual(record.packages[0], {
								"code": "TPROD_BASIC",
								"name": "basic package 2",
								"description": "this is a dummy updated description",
								"_TTL": 24 * 3600 * 1000,
								"acl": {
									"dev": {
										"urac": {
											'access': false,
											'apis': {
												'/account/changeEmail': {
													'access': true
												}
											}
										}
									}
								}
							});
							done();
							
						});
					});
				});
				
				it('fail - missing params', function (done) {
					var params = {
						qs: {"code": "BASIC2"},
						form: {
							"name": "basic package 2",
							"description": 'this is a dummy updated description',
							"_TTL": '24',
							"acl": {
								"urac": {
									'access': false,
									'apis': {
										'/account/changeEmail': {
											'access': true
										}
									}
								}
							}
						}
					};
					executeMyRequest(params, 'product/packages/update', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: id"
						});
						
						done();
					});
				});
				
				it("fail - wrong product id", function (done) {
					var params = {
						qs: {'id': wrong_Id, "code": "BASIC"},
						form: {
							"name": "basic package",
							"description": 'this is a dummy description',
							"_TTL": '12',
							"acl": {}
						}
					};
					executeMyRequest(params, 'product/packages/update', 'post', function (body) {
						assert.ok(body.errors);
						console.log(body.errors);
						done();
					});
				});
				
				it('fail - invalid package code provided', function (done) {
					var params = {
						qs: {'id': productId, "code": "BASI2"},
						form: {
							"name": "basic package 2",
							"description": 'this is a dummy updated description',
							"_TTL": '24',
							"acl": {
								"urac": {
									"dev": {
										'access': false,
										'apis': {
											'/account/changeEmail': {
												'access': true
											}
										}
									}
								}
							}
						}
					};
					executeMyRequest(params, 'product/packages/update', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {"code": 405, "message": errorCodes[405]});
						done();
					});
				});
				
			});
			
			describe("delete package tests", function () {
				
				it("success - will delete package", function (done) {
					var params = {
						qs: {
							"id": productId,
							"code": "PACKA"
						}
					};
					executeMyRequest(params, 'product/packages/delete', 'get', function (body) {
						assert.ifError(body.errors);
						assert.ok(body.data);
						done();
					});
				});
				
				it('fail - missing params', function (done) {
					var params = {
						qs: {}
					};
					executeMyRequest(params, 'product/packages/delete', 'get', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: code, id"
						});
						
						done();
					});
				});
				
				it('fail - invalid package code provided', function (done) {
					var params = {
						qs: {"id": productId, 'code': 'BASI4'}
					};
					executeMyRequest(params, 'product/packages/delete', 'get', function (body) {
						assert.deepEqual(body.errors.details[0], {"code": 419, "message": errorCodes[419]});
						done();
					});
				});
				
				it("fail - cannot delete package being used by current key", function (done) {
					var params = {
						qs: {"id": productId, 'code': 'BASIC'}
					};
					executeMyRequest(params, 'product/packages/delete', 'get', function (body) {
						assert.ok(body.errors);
						done();
					});
				});
				
				it('mongo test', function (done) {
					mongo.find('products', {}, {}, function (error, records) {
						assert.ifError(error);
						assert.ok(records);
						assert.equal(records.length, 2);
						assert.equal(records[1].packages.length, 1);
						done();
					});
				});
			});
			
			describe("list package tests", function () {
				//it("success - will get empty list", function(done) {
				//    var params = {
				//        qs: {"id": productId}
				//    };
				//    executeMyRequest(params, 'product/packages/list', 'get', function(body) {
				//        assert.ok(body.data);
				//        assert.equal(body.data.length, 0);
				//
				//        done();
				//    });
				//});
				//it("success - will add package", function(done) {
				//    var params = {
				//        qs: {"id": productId},
				//        form: {
				//            "code": "BASIC",
				//            "name": "basic package",
				//            "description": 'this is a dummy description',
				//            "_TTL": '12',
				//            "acl": {
				//                "urac": {
				//                    'access': false,
				//                    'apis': {
				//                        '/account/changeEmail': {
				//                            'access': true
				//                        }
				//                    }
				//                }
				//            }
				//        }
				//    };
				//    executeMyRequest(params, 'product/packages/add', 'post', function(body) {
				//        assert.ok(body.data);
				//
				//        done();
				//    });
				//});
				it("success - will list package", function (done) {
					var params = {
						qs: {"id": productId, 'code': 'BASIC'}
					};
					executeMyRequest(params, 'product/packages/list', 'get', function (body) {
						assert.ok(body.data);
						assert.equal(body.data.length, 1);
						assert.deepEqual(body.data[0], {
							"code": "TPROD_BASIC",
							"name": "basic package 2",
							"description": "this is a dummy updated description",
							"_TTL": 24 * 3600 * 1000,
							"acl": {
								"dev": {
									"urac": {
										'access': false,
										'apis': {
											'/account/changeEmail': {
												'access': true
											}
										}
									}
								}
							}
						});
						done();
					});
				});
			});
		});
	});
	
	describe("tenants tests", function () {
		var tenantId, applicationId, key, tstgTenantId;
		
		describe("tenant", function () {
			before(function (done) {
				uracMongo.remove('users', {'tenant.code': 'TSTN'}, function (error, data) {
					assert.ifError(error);
					uracMongo.remove('groups', {'tenant.code': 'TSTN'}, function (error, data) {
						assert.ifError(error);
						done();
					});
				});
			});
			
			describe("add tenant tests", function () {
				
				it("success - will add tenant and set type to client by default", function (done) {
					var params = {
						form: {
							"code": "TSTN",
							"name": 'test tenant',
							"email": 'admin@someTenant.com',
							"description": 'this is a dummy description'
						}
					};
					executeMyRequest(params, 'tenant/add', 'post', function (body) {
						console.log(JSON.stringify(body));
						assert.ok(body.data);
						done();
					});
				});
				
				it("success - will add tenant and set type to product and tag to testing", function (done) {
					var params = {
						form: {
							"code": "TSTG",
							"name": 'test product tenant',
							"email": 'admin2@someTenant.com',
							"description": 'this is a dummy product description',
							"type": 'product',
							"tag": 'testing'
						}
					};
					executeMyRequest(params, 'tenant/add', 'post', function (body) {
						console.log(JSON.stringify(body));
						assert.ok(body.data);
						tstgTenantId = body.data.id;
						done();
					});
				});
				
				it("fail - tenant admin user and/or group already exist in urac", function (done) {
					var record = {
						"username": "admin_utab",
						"password": "$2a$04$l3HbssI61jRMN/2C6yMBi.4oEgeLaRkTAFgbrvZ9fsHq.j29Tyic.",
						"firstName": "Administrator",
						"lastName": "urac test tenant",
						"email": "admin@anotherTenant.com",
						"status": "pendingNew",
						"config": {},
						"tenant": {
							"id": "56937dc1682d44112229beea",
							"code": "UTAB"
						},
						"ts": 1452506561932,
						"groups": [
							"administrator"
						]
					};
					uracMongo.insert("users", record, function (error, result) {
						assert.ifError(error);
						assert.ok(result);
						
						var params = {
							form: {
								"code": "UTAB",
								"name": 'urac test tenant',
								"email": 'admin@someTenant.com',
								"description": 'this is a dummy description'
							}
						};
						executeMyRequest(params, 'tenant/add', 'post', function (body) {
							assert.ok(body.errors);
							assert.deepEqual(body.errors.details[0], {code: 606, "message": errorCodes[606]});
							done();
						});
					});
				});
				
				it('fail - missing params', function (done) {
					var params = {
						form: {
							"name": "test tenant",
							"description": 'this is a dummy description'
						}
					};
					executeMyRequest(params, 'tenant/add', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: code, email"
						});
						
						done();
					});
				});
				
				it('fail - tenant exists', function (done) {
					var params = {
						form: {
							"code": "TSTN",
							"name": 'test tenant',
							"email": 'admin@someTenant.com',
							"description": 'this is a dummy description'
						}
					};
					executeMyRequest(params, 'tenant/add', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {"code": 423, "message": errorCodes[423]});
						done();
					});
				});
				
				it('mongo test', function (done) {
					
					mongo.findOne('tenants', {'code': 'TSTN'}, function (error, tenantRecord) {
						assert.ifError(error);
						tenantId = tenantRecord._id.toString();
						delete tenantRecord._id;
						assert.deepEqual(tenantRecord, {
							"code": "TSTN",
							"name": "test tenant",
							"description": "this is a dummy description",
							"type": "client",
							"applications": [],
							"oauth": {}
						});
						
						uracMongo.find('users', {'tenant.code': 'TSTN'}, function (error, data) {
							assert.ifError(error);
							assert.ok(data);
							uracMongo.find('groups', {'tenant.code': 'TSTN'}, function (error, data) {
								assert.ifError(error);
								assert.ok(data);
								done();
							});
						});
					});
				});
			});
			
			describe("update tenant tests", function () {
				it("success - will update tenant", function (done) {
					var params = {
						qs: {"id": tenantId},
						form: {
							"description": 'this is a dummy updated description',
							"name": "test tenant updated"
						}
					};
					executeMyRequest(params, 'tenant/update', 'post', function (body) {
						assert.ok(body.data);
						done();
					});
					
				});
				
				it("success - will get tenant", function (done) {
					var params = {
						qs: {
							"id": tenantId
						}
					};
					executeMyRequest(params, 'tenant/get', 'get', function (body) {
						console.log(body);
						assert.ok(body.data);
						delete body.data._id;
						assert.deepEqual(body.data, {
							"code": "TSTN",
							"name": "test tenant updated",
							"description": "this is a dummy updated description",
							"type": "client",
							"applications": [],
							"oauth": {}
						});
						done();
					});
				});
				
				it("success - will update tenant type and tag", function (done) {
					var params = {
						qs: {
							"id": tstgTenantId
						},
						form: {
							"code": "TSTG",
							"name": 'test product tenant updated',
							"email": 'admin2@someTenant.com',
							"description": 'this is a dummy product description updated',
							"type": 'client',
							"tag": 'myTag'
						}
					};
					executeMyRequest(params, 'tenant/update', 'post', function (body) {
						console.log(JSON.stringify(body));
						assert.ok(body.data);
						done();
					});
				});
				
				it('fail - missing params', function (done) {
					var params = {
						qs: {},
						form: {
							"description": 'this is a dummy description',
							"name": 'test tenant updated'
						}
					};
					executeMyRequest(params, 'tenant/update', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: id"
						});
						done();
					});
				});
				
				it('fail - invalid tenant id provided', function (done) {
					var params = {
						qs: {"id": "aaaabbdd"},
						form: {
							"description": 'this is a dummy description',
							"name": 'test tenant updated'
						}
					};
					executeMyRequest(params, 'tenant/update', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {"code": 438, "message": errorCodes[438]});
						
						done();
					});
				});
				
			});
			
			describe("delete tenant tests", function () {
				it('fail - missing params', function (done) {
					executeMyRequest({}, 'tenant/delete', 'get', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: id"
						});
						done();
					});
				});
				
				it('fail - invalid tenant id provided', function (done) {
					executeMyRequest({qs: {id: 'aaaabdddd'}}, 'tenant/delete', 'get', function (body) {
						assert.deepEqual(body.errors.details[0], {"code": 438, "message": errorCodes[438]});
						done();
					});
				});
				
				it("success - will delete tenant", function (done) {
					executeMyRequest({'qs': {id: tenantId}}, 'tenant/delete/', 'get', function (body) {
						assert.ok(body.data);
						
						done();
					});
				});
				
			});
			
			describe("list tenant tests", function () {
				it("success - will get empty list", function (done) {
					executeMyRequest({}, 'tenant/list', 'get', function (body) {
						assert.ok(body.data);
						done();
					});
				});
				
				it("success - will add tenant", function (done) {
					var params = {
						form: {
							"code": "TSTN",
							"email": "admin@someTenant.com",
							"description": 'this is a dummy description',
							"name": "test tenant"
						}
					};
					
					uracMongo.remove('users', {'tenant.code': 'TSTN'}, function (error) {
						assert.ifError(error);
						uracMongo.remove('groups', {'tenant.code': 'TSTN'}, function (error) {
							assert.ifError(error);
							
							executeMyRequest(params, 'tenant/add', 'post', function (body) {
								assert.ok(body.data);
								mongo.findOne('tenants', {'code': 'TSTN'}, function (error, tenantRecord) {
									assert.ifError(error);
									tenantId = tenantRecord._id.toString();
									console.log(JSON.stringify(tenantRecord));
									done();
								});
							});
							
						});
					});
				});
				
				it("succeess - will list tenants of type client only", function (done) {
					var params = {
						qs: {
							"type": "client"
						}
					};
					executeMyRequest(params, 'tenant/list', 'get', function (body) {
						assert.ok(body.data);
						body.data.forEach(function (tenant) {
							assert.deepEqual(tenant.type, "client");
						});
						done();
					});
				});
			});
		});
		
		describe("oauth", function () {
			describe("add oauth tests", function () {
				it("success - will add oauth", function (done) {
					var params = {
						qs: {
							'id': tenantId
						},
						form: {
							"secret": "my secret key",
							"redirectURI": "http://www.myredirecturi.com/"
						}
					};
					
					executeMyRequest(params, 'tenant/oauth/add/', 'post', function (body) {
						console.log(JSON.stringify(body));
						assert.ok(body.data);
						
						mongo.findOne('tenants', {'code': 'TSTN'}, function (error, tenantRecord) {
							assert.ifError(error);
							assert.deepEqual(tenantRecord.oauth, {
								"secret": "my secret key",
								"redirectURI": "http://www.myredirecturi.com/",
								"grants": ["password", "refresh_token"]
							});
							done();
							
						});
						
					});
				});
				
				it('fail - missing params', function (done) {
					var params = {
						qs: {},
						form: {
							"secret": "my secret key",
							"redirectURI": "http://www.myredirecturi.com/"
						}
					};
					executeMyRequest(params, 'tenant/oauth/add/', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: id"
						});
						
						done();
					});
				});
				
				it("success - will get tenant containing oauth", function (done) {
					var params = {
						qs: {
							'id': tenantId
						}
					};
					
					executeMyRequest(params, 'tenant/get', 'get', function (body) {
						console.log(JSON.stringify(body));
						assert.ok(body.data);
						assert.ok(body.data.oauth.authorization);
						done();
					});
				});
			});
			
			describe("update oauth tests", function () {
				it("success - will update oauth", function (done) {
					var params = {
						qs: {id: tenantId},
						form: {
							"secret": "my secret key",
							"redirectURI": "http://www.myredirecturi2.com/"
						}
					};
					executeMyRequest(params, 'tenant/oauth/update/', 'post', function (body) {
						assert.ok(body.data);
						mongo.findOne('tenants', {'code': 'TSTN'}, function (error, tenantRecord) {
							assert.ifError(error);
							assert.deepEqual(tenantRecord.oauth, {
								"secret": "my secret key",
								"redirectURI": "http://www.myredirecturi2.com/",
								"grants": ["password", "refresh_token"]
							});
							done();
						});
					});
				});
				
				it('fail - missing params', function (done) {
					var params = {
						qs: {},
						form: {
							"secret": "my secret key",
							"redirectURI": "http://www.myredirecturi.com/"
						}
					};
					executeMyRequest(params, 'tenant/oauth/update', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: id"
						});
						
						done();
					});
				});
			});
			
			describe("delete oauth tests", function () {
				it('fail - missing params', function (done) {
					executeMyRequest({qs: {}}, 'tenant/oauth/delete', 'get', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: id"
						});
						
						done();
					});
				});
				
				it("success - will delete oauth", function (done) {
					executeMyRequest({qs: {id: tenantId}}, 'tenant/oauth/delete/', 'get', function (body) {
						assert.ok(body.data);
						done();
					});
				});
			});
			
			describe("list oauth tests", function () {
				it("success - will get empty object", function (done) {
					executeMyRequest({qs: {id: tenantId}}, 'tenant/oauth/list/', 'get', function (body) {
						assert.ok(body.data);
						assert.equal(JSON.stringify(body.data), '{}');
						done();
					});
				});
				it("success - will add oauth", function (done) {
					var params = {
						qs: {id: tenantId},
						form: {
							"secret": "my secret key",
							"redirectURI": "http://www.myredirecturi.com/"
						}
					};
					executeMyRequest(params, 'tenant/oauth/add/', 'post', function (body) {
						assert.ok(body.data);
						done();
					});
				});
				it("success - will get oauth object", function (done) {
					executeMyRequest({qs: {id: tenantId}}, 'tenant/oauth/list/', 'get', function (body) {
						assert.ok(body.data);
						assert.deepEqual(body.data, {
							"secret": "my secret key",
							"redirectURI": "http://www.myredirecturi.com/",
							"grants": ["password", "refresh_token"]
						});
						done();
					});
				});
			});
		});
		
		describe("oauth users", function () {
			var oauthUserId, oauthUserId2;
			describe("add oauth users tests", function () {
				it("success - will add oauth user", function (done) {
					var params = {
						qs: {
							'id': tenantId
						},
						form: {
							"userId": "oauth_user",
							"password": "password1"
						}
					};
					
					executeMyRequest(params, 'tenant/oauth/users/add/', 'post', function (body) {
						console.log(JSON.stringify(body));
						assert.ok(body.data);
						
						mongo.findOne('oauth_urac', {'userId': 'oauth_user'}, function (error, tenantRecord) {
							assert.ifError(error);
							assert.ok(tenantRecord);
							assert.equal(tenantRecord.userId, "oauth_user");
							assert.equal(tenantRecord.tId.toString(), tenantId);
							oauthUserId = tenantRecord._id.toString();
							done();
						});
					});
				});
				
				it('fail - missing params', function (done) {
					var params = {
						qs: {},
						form: {
							"userId": "oauth_user",
							"password": "password1"
						}
					};
					executeMyRequest(params, 'tenant/oauth/users/add/', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: id"
						});
						
						done();
					});
				});
				
			});
			
			describe("update oauth users tests", function () {
				it("success - will update oauth users", function (done) {
					var params = {
						qs: {
							id: tenantId,
							uId: oauthUserId
						},
						form: {
							"userId": "oauth_user_up",
							"password": "password2"
						}
					};
					executeMyRequest(params, 'tenant/oauth/users/update/', 'post', function (body) {
						assert.ok(body.data);
						mongo.findOne('oauth_urac', {'userId': 'oauth_user_up'}, function (error, tenantRecord) {
							assert.ifError(error);
							assert.ok(tenantRecord);
							assert.equal(tenantRecord.userId, 'oauth_user_up');
							assert.equal(tenantRecord.tId.toString(), tenantId);
							oauthUserId2 = tenantRecord._id.toString();
							done();
						});
					});
				});
				
				it("fail - will update oauth users without password", function (done) {
					var params = {
						qs: {
							id: tenantId,
							uId: oauthUserId
						},
						form: {}
					};
					executeMyRequest(params, 'tenant/oauth/users/update/', 'post', function (body) {
						console.log(JSON.stringify(body));
						assert.deepEqual(body.errors.details[0], {
							"code": 451,
							"message": "Unable to updated tenant oAuth User"
						});
						done();
					});
				});
				
				it('fail - missing params', function (done) {
					var params = {
						qs: {
							uId: oauthUserId
						},
						form: {
							"userId": "oauth_user_up",
							"password": "password2"
						}
					};
					executeMyRequest(params, 'tenant/oauth/users/update', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: id"
						});
						
						done();
					});
				});
				
				it('fail - user does not exist', function (done) {
					var params = {
						qs: {
							'id': tenantId,
							uId: '22d2cb5fc04ce51e06000001'
						},
						form: {
							"userId": "invalid",
							"password": "password2"
						}
					};
					executeMyRequest(params, 'tenant/oauth/users/update', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 447,
							"message": "Unable to get tenant oAuth Users"
						});
						
						done();
					});
				});
				
				it('fail - invalid userid given', function (done) {
					var params = {
						qs: {
							'id': tenantId,
							'uId': 'invalid'
						},
						form: {
							"userId": "invalid",
							"password": "password2"
						}
					};
					executeMyRequest(params, 'tenant/oauth/users/update', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 439,
							"message": "Invalid tenant oauth user Id provided"
						});
						
						done();
					});
				});
				
				it('fail - userid already exist in another account', function (done) {
					var params = {
						qs: {
							'id': tenantId
						},
						form: {
							"userId": "oauth_user2",
							"password": "password1"
						}
					};
					
					executeMyRequest(params, 'tenant/oauth/users/add/', 'post', function (body) {
						console.log(JSON.stringify(body));
						assert.ok(body.data);
						
						
						var params = {
							qs: {
								id: tenantId,
								uId: oauthUserId
							},
							form: {
								"userId": "oauth_user2",
								"password": "password2"
							}
						};
						executeMyRequest(params, 'tenant/oauth/users/update/', 'post', function (body) {
							assert.deepEqual(body.errors.details[0], {
								"code": 448,
								"message": "tenant oAuth User already exists"
							});
							
							done();
						});
					});
				});
			});
			
			describe("delete oauth tests", function () {
				it('fail - missing params', function (done) {
					executeMyRequest({qs: {uId: oauthUserId}}, 'tenant/oauth/users/delete', 'get', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: id"
						});
						
						done();
					});
				});
				
				it('fail - invalid id provided', function (done) {
					executeMyRequest({
						qs: {
							id: tenantId,
							uId: 'abcde'
						}
					}, 'tenant/oauth/users/delete', 'get', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 439,
							"message": "Invalid tenant oauth user Id provided"
						});
						
						done();
					});
				});
				
				it("success - will delete oauth user", function (done) {
					executeMyRequest({
						qs: {
							id: tenantId,
							'uId': oauthUserId
						}
					}, 'tenant/oauth/users/delete/', 'get', function (body) {
						assert.ok(body.data);
						done();
					});
				});
				
			});
			
			describe("list oauth users tests", function () {
				
				it("success - will get oauth users", function (done) {
					executeMyRequest({qs: {id: tenantId}}, 'tenant/oauth/users/list/', 'get', function (body) {
						assert.ok(body.data);
						assert.equal(body.data.length, 1);
						done();
					});
				});
				
				it("success - will remove oauth user", function (done) {
					var params = {
						qs: {
							id: tenantId,
							uId: oauthUserId2
						}
					};
					executeMyRequest(params, 'tenant/oauth/users/delete/', 'get', function (body) {
						assert.ok(body.data);
						done();
					});
				});
				
				it("success - will get empty object", function (done) {
					executeMyRequest({qs: {id: tenantId}}, 'tenant/oauth/users/list/', 'get', function (body) {
						assert.ok(body.data);
						assert.equal(body.data.length, 1);
						done();
					});
				});
			});
		});
		
		describe("applications", function () {
			
			describe("add applications tests", function () {
				it("success - will add application", function (done) {
					var params = {
						qs: {'id': tenantId},
						form: {
							"productCode": "TPROD",
							"packageCode": "BASIC",
							"description": "this is a dummy description",
							"_TTL": '12'
						}
					};
					executeMyRequest(params, 'tenant/application/add', 'post', function (body) {
						assert.ok(body.data);
						done();
					});
				});
				
				it('fail - missing params', function (done) {
					var params = {
						qs: {},
						form: {
							"productCode": "TPROD",
							"packageCode": "BASIC",
							"description": "this is a dummy description",
							"_TTL": '12'
						}
					};
					executeMyRequest(params, 'tenant/application/add/', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: id"
						});
						
						done();
					});
				});
				
				it('fail - invalid product code given', function (done) {
					var params = {
						qs: {'id': tenantId},
						form: {
							"productCode": "INVAL",
							"packageCode": "BASIC",
							"description": "this is a dummy description",
							"_TTL": '12'
						}
					};
					executeMyRequest(params, 'tenant/application/add/', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {"code": 434, "message": errorCodes[434]});
						
						done();
					});
				});
				
				it('fail - invalid package code given', function (done) {
					var params = {
						qs: {'id': tenantId},
						form: {
							"productCode": "TPROD",
							"packageCode": "INVAL",
							"description": "this is a dummy description",
							"_TTL": '12'
						}
					};
					executeMyRequest(params, 'tenant/application/add/', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {"code": 434, "message": errorCodes[434]});
						
						done();
					});
				});
				
				it('mongo test', function (done) {
					mongo.findOne('tenants', {"code": "TSTN"}, function (error, records) {
						assert.ifError(error);
						assert.ok(records);
						
						assert.ok(records.applications);
						assert.equal(records.applications.length, 1);
						applicationId = records.applications[0].appId.toString();
						delete records.applications[0].appId;
						assert.deepEqual(records.applications[0], {
							"product": "TPROD",
							"package": "TPROD_BASIC",
							"description": "this is a dummy description",
							"_TTL": 12 * 3600 * 1000,
							'keys': []
						});
						done();
					});
				});
			});
			
			describe("update applications tests", function () {
				it("success - will update application", function (done) {
					var params = {
						qs: {'id': tenantId, 'appId': applicationId},
						form: {
							"productCode": "TPROD",
							"packageCode": "BASIC",
							"description": "this is a dummy description updated",
							"_TTL": '24',
							"acl": {
								"urac": {}
							}
						}
					};
					executeMyRequest(params, 'tenant/application/update', 'post', function (body) {
						assert.ok(body.data);
						done();
					});
				});
				it("fail - wrong key", function (done) {
					var params = {
						qs: {'id': tenantId, 'appId': 'fdsffsd'},
						form: {
							"productCode": "TPROD",
							"packageCode": "BASIC",
							"description": "this is a dummy description updated",
							"_TTL": '24',
							"acl": {
								"urac": {}
							}
						}
					};
					executeMyRequest(params, 'tenant/application/update', 'post', function (body) {
						console.log(body);
						assert.ok(body.errors);
						done();
					});
				});
				
				it('fail - missing params', function (done) {
					var params = {
						qs: {'id': tenantId, 'appId': applicationId},
						form: {
							"packageCode": "BASIC",
							"description": "this is a dummy description",
							"_TTL": '12'
						}
					};
					executeMyRequest(params, 'tenant/application/update', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: productCode"
						});
						
						done();
					});
				});
				
				it('fail - invalid product code given', function (done) {
					var params = {
						qs: {'id': tenantId, 'appId': applicationId},
						form: {
							"productCode": "INVAL",
							"packageCode": "BASIC",
							"description": "this is a dummy description",
							"_TTL": '12'
						}
					};
					executeMyRequest(params, 'tenant/application/update', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {"code": 434, "message": errorCodes[434]});
						
						done();
					});
				});
				
				it('fail - invalid package code given', function (done) {
					var params = {
						qs: {'id': tenantId, 'appId': applicationId},
						form: {
							"productCode": "TPROD",
							"packageCode": "INVAL",
							"description": "this is a dummy description",
							"_TTL": '12'
						}
					};
					executeMyRequest(params, 'tenant/application/update', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {"code": 434, "message": errorCodes[434]});
						
						done();
					});
				});
				
				it('mongo test', function (done) {
					mongo.findOne('tenants', {"code": "TSTN"}, function (error, records) {
						assert.ifError(error);
						assert.ok(records);
						assert.ok(records.applications);
						assert.ok(records.applications.length, 2);
						delete records.applications[0].appId;
						assert.deepEqual(records.applications[0], {
							"product": "TPROD",
							"package": "TPROD_BASIC",
							"description": "this is a dummy description updated",
							"_TTL": 24 * 3600 * 1000,
							'keys': [],
							"acl": {
								"urac": {}
							}
							//"acl": {
							//	"urac": {
							//		'access': false,
							//		'apis': {
							//			'/account/changeEmail': {
							//				'access': true
							//			}
							//		}
							//	}
							//}
						});
						done();
					});
				});
				
				it("success - will clear application acl", function (done) {
					var params = {
						qs: {'id': tenantId, 'appId': applicationId},
						form: {
							"productCode": "TPROD",
							"packageCode": "BASIC",
							"description": "this is a dummy description updated",
							"_TTL": '24',
							"clearAcl": true,
							"acl": {}
						}
					};
					executeMyRequest(params, 'tenant/application/update', 'post', function (body) {
						assert.ok(body);
						assert.ok(body.data);
						mongo.findOne('tenants', {"code": "TSTN"}, function (error, records) {
							assert.ifError(error);
							console.log(JSON.stringify(records));
							assert.ok(records.applications);
							assert.equal(records.applications.length, 1);
							applicationId = records.applications[0].appId.toString();
							delete records.applications[0].appId;
							delete records.oauth;
							assert.deepEqual(records.applications[0], {
								"product": "TPROD",
								"package": "TPROD_BASIC",
								"description": "this is a dummy description updated",
								"_TTL": 24 * 3600 * 1000,
								'keys': []
							});
							done();
						});
						
					});
				});
			});
			
			describe("delete applications tests", function () {
				it('fail - missing params', function (done) {
					executeMyRequest({qs: {'id': tenantId}}, 'tenant/application/delete/', 'get', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: appId"
						});
						done();
					});
				});
				
				it("success - will delete application", function (done) {
					executeMyRequest({
						qs: {
							'id': tenantId,
							'appId': applicationId
						}
					}, 'tenant/application/delete/', 'get', function (body) {
						assert.ok(body.data);
						done();
					});
				});
				it("fail - wrong key", function (done) {
					executeMyRequest({
						qs: {
							'id': tenantId,
							'appId': 'fdfdsfs'
						}
					}, 'tenant/application/delete/', 'get', function (body) {
						assert.ok(body.errors);
						done();
					});
				});
				
				
			});
			
			describe("list applications tests", function () {
				it("success - will get empty object", function (done) {
					executeMyRequest({qs: {id: tenantId}}, 'tenant/application/list/', 'get', function (body) {
						assert.ok(body.data);
						assert.equal(body.data.length, 0);
						done();
					});
				});
				it("fail - wrong id", function (done) {
					executeMyRequest({qs: {id: wrong_Id}}, 'tenant/application/list/', 'get', function (body) {
						assert.ok(body.errors);
						console.log(body.errors);
						done();
					});
				});
				it("success - will add application", function (done) {
					var params = {
						qs: {id: tenantId},
						form: {
							"productCode": "TPROD",
							"packageCode": "BASIC",
							"description": "this is a dummy description",
							"_TTL": '12',
							"acl": {
								"urac": {}
							}
						}
					};
					executeMyRequest(params, 'tenant/application/add/', 'post', function (body) {
						assert.ok(body.data);
						done();
					});
				});
				it("fail - cant add application - wrong id", function (done) {
					var params = {
						qs: {id: wrong_Id},
						form: {
							"productCode": "TPROD",
							"packageCode": "BASIC",
							"description": "this is a dummy description",
							"_TTL": '12',
							"acl": {}
						}
					};
					executeMyRequest(params, 'tenant/application/add/', 'post', function (body) {
						assert.ok(body.errors);
						done();
					});
				});
				it("success - will list applications", function (done) {
					executeMyRequest({qs: {id: tenantId}}, 'tenant/application/list/', 'get', function (body) {
						assert.ok(body.data);
						assert.equal(body.data.length, 1);
						applicationId = body.data[0].appId.toString();
						delete body.data[0].appId;
						assert.deepEqual(body.data[0], {
							"product": "TPROD",
							"package": "TPROD_BASIC",
							"description": "this is a dummy description",
							//"acl": {
							//	"urac": {
							//		'access': false,
							//		'apis': {
							//			'/account/changeEmail': {
							//				'access': true
							//			}
							//		}
							//	}
							//},
							"acl": {
								"urac": {}
							},
							"_TTL": 12 * 3600 * 1000,
							"keys": []
						});
						done();
					});
				});
			});
		});
		
		describe("application keys", function () {
			describe("add application keys", function () {
				it("success - will add key", function (done) {
					var params = {
						qs: {
							'id': tenantId,
							'appId': applicationId
						}
					};
					executeMyRequest(params, 'tenant/application/key/add', 'post', function (body) {
						assert.ok(body.data);
						done();
					});
				});
				it("fail - app id not found", function (done) {
					var params = {
						qs: {
							'id': tenantId,
							'appId': 'xxxx'
						}
					};
					executeMyRequest(params, 'tenant/application/key/add', 'post', function (body) {
						assert.ok(body);
						console.log(body);
						done();
					});
				});
				
				it('fail - missing params', function (done) {
					var params = {
						qs: {
							'id': tenantId
						}
					};
					executeMyRequest(params, 'tenant/application/key/add/', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: appId"
						});
						done();
					});
				});
				
				it('mongo test', function (done) {
					mongo.findOne('tenants', {"code": "TSTN"}, function (error, records) {
						assert.ifError(error);
						assert.ok(records);
						
						assert.ok(records.applications);
						assert.equal(records.applications.length, 1);
						assert.equal(records.applications[0].keys.length, 1);
						assert.ok(records.applications[0].keys[0].key);
						key = records.applications[0].keys[0].key;
						done();
					});
				});
				
			});
			
			describe("delete application keys", function () {
				it("success - will delete key", function (done) {
					var params = {
						qs: {
							'id': tenantId,
							'appId': applicationId,
							'key': key.toString()
						}
					};
					executeMyRequest(params, 'tenant/application/key/delete', 'get', function (body) {
						assert.ok(body.data);
						done();
					});
				});
				it("fail - wrong key", function (done) {
					var params = {
						qs: {
							'id': tenantId,
							'appId': applicationId,
							'key': 'gdsgsfds'
						}
					};
					executeMyRequest(params, 'tenant/application/key/delete', 'get', function (body) {
						assert.ok(body);
						assert.ok(body.errors);
						assert.deepEqual(body.errors.details[0], {
							"code": 437,
							"message": "Unable to remove key from the tenant application"
						});
						done();
					});
				});
				
				it('fail - missing params', function (done) {
					var params = {
						qs: {
							'id': tenantId,
							'appId': applicationId
						}
					};
					executeMyRequest(params, 'tenant/application/key/delete', 'get', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: key"
						});
						done();
					});
				});
				
			});
			
			describe("list application keys", function () {
				it("success - will add key", function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId
						}
					};
					executeMyRequest(params, 'tenant/application/key/list', 'get', function (body) {
						assert.ok(body.data);
						assert.equal(body.data.length, 0);
						done();
					});
				});
				
				it("success - will add key", function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId
						}
					};
					executeMyRequest(params, 'tenant/application/key/add/', 'post', function (body) {
						assert.ok(body.data);
						done();
					});
				});
				
				it("success - will list key", function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId
						}
					};
					executeMyRequest(params, 'tenant/application/key/list/', 'get', function (body) {
						assert.ok(body.data);
						assert.equal(body.data.length, 1);
						key = body.data[0].key.toString();
						done();
					});
				});
			});
		});
		
		describe("application ext keys", function () {
			var extKey;
			describe("add application ext keys", function () {
				it("success - will add ext key", function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId,
							key: key
						},
						form: {
							'expDate': expDateValue,
							'device': {
								'a': 'b'
							},
							'geo': {
								'x': 'y'
							},
							'env': 'DASHBOARD'
						}
					};
					executeMyRequest(params, 'tenant/application/key/ext/add/', 'post', function (body) {
						console.log(JSON.stringify(body));
						assert.ok(body.data);
						done();
					});
				});
				
				it('fail - wrong key', function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId,
							key: '0243306942ef6a1d8856bbee217daabb'
						},
						form: {
							'expDate': new Date().toISOString(),
							'device': {
								'a': 'b'
							},
							'geo': {
								'x': 'y'
							},
							'env': 'DASHBOARD'
						}
					};
					executeMyRequest(params, 'tenant/application/key/ext/add/', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {"code": 440, "message": errorCodes[440]});
						done();
					});
				});
				
				it('fail - missing params', function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId
						},
						form: {
							'expDate': new Date().toISOString(),
							'device': {
								'a': 'b'
							},
							'geo': {
								'x': 'y'
							},
							'env': 'DASHBOARD'
						}
					};
					executeMyRequest(params, 'tenant/application/key/ext/add/', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: key"
						});
						
						done();
					});
				});
				
				it('mongo test', function (done) {
					mongo.findOne('tenants', {"code": "TSTN"}, function (error, records) {
						assert.ifError(error);
						assert.ok(records);
						
						assert.ok(records.applications);
						assert.equal(records.applications.length, 1);
						assert.equal(records.applications[0].keys.length, 1);
						assert.ok(records.applications[0].keys[0].key);
						key = records.applications[0].keys[0].key;
						assert.equal(records.applications[0].keys[0].extKeys.length, 1);
						extKey = records.applications[0].keys[0].extKeys[0].extKey;
						delete records.applications[0].keys[0].extKeys[0].extKey;
						assert.deepEqual(records.applications[0].keys[0].extKeys[0], {
							'expDate': new Date(expDateValue).getTime() + config.expDateTTL,
							'device': {
								'a': 'b'
							},
							'geo': {
								'x': 'y'
							},
							'env': 'DASHBOARD'
						});
						done();
					});
				});
				
				it("success - will add two external keys (using locked product) but only one with dashboard access", function (done) {
					var params = {
						form: {
							'code': "RATE",
							'name': "Random Tenant",
							'email': "user@tenantDomain.com"
						}
					};
					executeMyRequest(params, 'tenant/add', 'post', function (tenant_body) {
						assert.ok(tenant_body.data.id);
						params = {
							qs: {
								"id": tenant_body.data.id
							},
							form: {
								'description': 'Test Dashboard application',
								'_TTL': '168',
								'productCode': 'DSBRD',
								'packageCode': 'OWNER'
							}
						};
						executeMyRequest(params, 'tenant/application/add', 'post', function (app_body) {
							assert.ok(app_body.data.appId);
							params = {
								qs: {
									"id": tenant_body.data.id,
									"appId": app_body.data.appId
								}
							};
							executeMyRequest(params, 'tenant/application/key/add', 'post', function (key_body) {
								assert.ok(key_body.data.key);
								params = {
									qs: {
										"id": tenant_body.data.id,
										"appId": app_body.data.appId,
										"key": key_body.data.key
									},
									form: {
										"env": "DASHBOARD"
									}
								};
								executeMyRequest(params, 'tenant/application/key/ext/add', 'post', function (extKey_body) {
									assert.ok(extKey_body.data.extKey);
									params = {
										qs: {
											"id": tenant_body.data.id,
											"appId": app_body.data.appId,
											"key": key_body.data.key
										},
										form: {
											"env": "DASHBOARD"
										}
									};
									executeMyRequest(params, 'tenant/application/key/ext/add', 'post', function (extKeyTwo_body) {
										assert.ok(extKeyTwo_body.data.extKey);
										mongo.count("dashboard_extKeys", {"code": "RATE"}, function (error, count) {
											assert.ifError(error);
											assert.ok(count);
											assert.equal(count, 1);
											
											done();
										});
									});
								});
							});
						});
					});
				});
				
				it("success - will add an external key for all environments using their corresponding encryption key (tenant using old acl)", function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId,
							key: key
						},
						form: {
							'expDate': expDateValue,
							'device': {
								'a': 'b'
							},
							'geo': {
								'x': 'y'
							},
							'env': 'DEV'
						}
					};
					
					executeMyRequest(params, 'tenant/application/key/ext/add/', 'post', function (body) {
						console.log(JSON.stringify(body));
						assert.ok(body.data);
						done();
					});
				});
				
				it("success - will add an external key for DEV environment using its corresponding encryption key (tenant using new acl)", function (done) {
					var newAcl = {
						'dev': {
							'example01': {
								"access": ["user"],
								"apis": {}
							}
						},
						'dashboard': {
							'urac': {
								"access": false,
								"apis": {
									"/account/changeEmail": {
										"access": true
									}
								}
							},
							'dashboard': {
								"access": ["owner"],
								"apis": {}
							}
						}
					};
					
					try {
						var id = mongo.ObjectId(tenantId);
					} catch (e) {
						assert.ifError(e);
					}
					
					//Upgrading acl of TSTN from old to new and removing external keys for all environments except dashboard
					mongo.findOne("tenants", {"_id": id}, function (error, tenantRecord) {
						assert.ifError(error);
						assert.ok(tenantRecord);
						tenantRecord.applications[0].acl = newAcl;
						tenantRecord.applications[0].keys[0].extKeys = [
							{
								"extKey": extKey,
								"device": {},
								"geo": {},
								"env": "DASHBOARD",
								"expDate": 1456498678832
							}
						];
						mongo.save("tenants", tenantRecord, function (error, result) {
							assert.ifError(error);
							assert.ok(result);
							
							var params = {
								qs: {
									id: tenantId,
									appId: applicationId,
									key: key
								},
								form: {
									'expDate': expDateValue,
									'device': {
										'a': 'b'
									},
									'geo': {
										'x': 'y'
									},
									'env': 'DEV'
								}
							};
							
							executeMyRequest(params, 'tenant/application/key/ext/add/', 'post', function (body) {
								assert.ok(body.data);
								done();
							});
						});
					});
				});
				
				it("fail - trying to add an external key for an environment that does not exist in new acl", function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId,
							key: key
						},
						form: {
							'expDate': expDateValue,
							'device': {
								'a': 'b'
							},
							'geo': {
								'x': 'y'
							},
							'env': 'PROD'
						}
					};
					
					executeMyRequest(params, 'tenant/application/key/ext/add/', 'post', function (body) {
						assert.ok(body.errors);
						assert.deepEqual(body.errors.details[0], {"code": 740, "message": errorCodes[740]});
						done();
					});
				});
			});
			
			describe("update application ext keys", function () {
				it("success - will update ext key", function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId,
							key: key
						},
						form: {
							'extKey': extKey,
							'expDate': expDateValue,
							'device': {
								'a': 'b'
							},
							'geo': {
								'x': 'y'
							}
						}
					};
					executeMyRequest(params, 'tenant/application/key/ext/update/', 'post', function (body) {
						assert.ok(body.data);
						done();
					});
				});
				
				it('fail - wrong key value', function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId,
							key: key
						},
						form: {
							'extKey': 'fdfdgdfgdf',
							'expDate': new Date().toISOString(),
							'device': {
								'a': 'b'
							},
							'geo': {
								'x': 'y'
							}
						}
					};
					executeMyRequest(params, 'tenant/application/key/ext/update/', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 441,
							"message": "Unable to update the tenant application ext Key"
						});
						done();
					});
				});
				
				it('fail - missing params', function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId,
							key: key
						},
						form: {
							'expDate': new Date().toISOString(),
							'device': {
								'a': 'b'
							},
							'geo': {
								'x': 'y'
							}
						}
					};
					executeMyRequest(params, 'tenant/application/key/ext/update/', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: extKey"
						});
						
						done();
					});
				});
				
				it('mongo test', function (done) {
					mongo.findOne('tenants', {"code": "TSTN"}, function (error, records) {
						assert.ifError(error);
						assert.ok(records);
						
						assert.ok(records.applications);
						assert.equal(records.applications.length, 1);
						assert.equal(records.applications[0].keys.length, 1);
						assert.ok(records.applications[0].keys[0].key);
						key = records.applications[0].keys[0].key;
						assert.equal(records.applications[0].keys[0].extKeys.length, 2);
						extKey = records.applications[0].keys[0].extKeys[0].extKey;
						delete records.applications[0].keys[0].extKeys[0].extKey;
						assert.deepEqual(records.applications[0].keys[0].extKeys[0], {
							'expDate': new Date(expDateValue).getTime() + config.expDateTTL,
							'device': {
								'a': 'b'
							},
							'geo': {
								'x': 'y'
							},
							'env': 'DASHBOARD'
						});
						done();
					});
				});
			});
			
			describe("delete application ext keys", function () {
				it("success - will delete ext key", function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId,
							key: key
						},
						form: {
							'extKey': extKey
						}
					};
					executeMyRequest(params, 'tenant/application/key/ext/delete/', 'post', function (body) {
						assert.ok(body.data);
						done();
					});
				});
				it("fail - wrong key value", function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: 'hjghjvbhgj',
							key: key
						},
						form: {
							'extKey': extKey
						}
					};
					executeMyRequest(params, 'tenant/application/key/ext/delete/', 'post', function (body) {
						assert.ok(body.errors);
						assert.deepEqual(body.errors.details[0], {
							"code": 443,
							"message": "Unable to remove tenant application ext Key"
						});
						done();
					});
				});
				
				it('fail - missing params', function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId,
							key: key
						},
						form: {}
					};
					executeMyRequest(params, 'tenant/application/key/ext/delete/', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: extKey"
						});
						
						done();
					});
				});
				
				it('mongo test', function (done) {
					mongo.findOne('tenants', {"code": "TSTN"}, function (error, records) {
						assert.ifError(error);
						assert.ok(records);
						
						assert.ok(records.applications);
						assert.equal(records.applications.length, 1);
						assert.equal(records.applications[0].keys.length, 1);
						assert.ok(records.applications[0].keys[0].key);
						key = records.applications[0].keys[0].key;
						assert.equal(records.applications[0].keys[0].extKeys.length, 1);
						done();
					});
				});
			});
			
			describe("list application ext keys", function () {
				it("success - will list ext key", function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId,
							key: key
						}
					};
					executeMyRequest(params, 'tenant/application/key/ext/list/', 'get', function (body) {
						assert.ok(body.data);
						assert.equal(body.data.length, 1);
						done();
					});
				});
				it("fail - wrong key", function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId,
							key: 'fffdfs'
						}
					};
					console.log(params);
					///////////// check this . no error msg. just empty data
					executeMyRequest(params, 'tenant/application/key/ext/list/', 'get', function (body) {
						console.log(body);
						console.log(' ******************************** ');
						//assert.ok(body.errors);
						done();
					});
				});
				
				it("success - will add ext key", function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId,
							key: key
						},
						form: {
							'expDate': expDateValue,
							'device': {
								'a': 'b'
							},
							'geo': {
								'x': 'y'
							},
							'env': 'DASHBOARD'
						}
					};
					executeMyRequest(params, 'tenant/application/key/ext/add/', 'post', function (body) {
						assert.ok(body.data);
						
						done();
					});
				});
				
				it("success - will list ext key", function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId,
							key: key
						}
					};
					executeMyRequest(params, 'tenant/application/key/ext/list/', 'get', function (body) {
						assert.ok(body.data);
						assert.equal(body.data.length, 2);
						
						done();
					});
				});
				
				it("success - will list ext keys that contain an ext key with dashboard access", function (done) {
					mongo.findOne("tenants", {"code": "test"}, function (error, record) {
						assert.ifError(error);
						assert.ok(record);
						
						var params = {
							qs: {
								id: record._id.toString(),
								appId: record.applications[0].appId.toString(),
								key: record.applications[0].keys[0].key
							}
						};
						executeMyRequest(params, 'tenant/application/key/ext/list/', 'get', function (body) {
							assert.ok(body.data);
							assert.ok(body.data[0].dashboardAccess);
							done();
						});
					})
				});
			});
		});
		
		describe("application config", function () {
			describe("update application config", function () {
				
				it("success - will update configuration (empty config)", function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId,
							key: key
						},
						form: {
							'envCode': 'DEV',
							'config': {}
						}
					};
					executeMyRequest(params, 'tenant/application/key/config/update', 'post', function (body) {
						assert.ok(body.data);
						done();
					});
				});
				
				it("success - will update configuration", function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId,
							key: key
						},
						form: {
							'envCode': 'DEV',
							'config': {
								'mail': {
									'a': 'b'
								},
								'urac': {
									'x': 'y'
								}
							}
						}
					};
					executeMyRequest(params, 'tenant/application/key/config/update', 'post', function (body) {
						assert.ok(body.data);
						done();
					});
				});
				
				it("fail - wrong key", function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId,
							key: 'gfdgdf'
						},
						form: {
							'envCode': 'DEV',
							'config': {
								'mail': {
									'a': 'b'
								},
								'urac': {
									'x': 'y'
								}
							}
						}
					};
					executeMyRequest(params, 'tenant/application/key/config/update', 'post', function (body) {
						assert.ok(body.errors);
						assert.deepEqual(body.errors.details[0],
							{"code": 445, "message": "Unable to update the tenant application configuration"});
						
						done();
					});
				});
				
				it('fail - missing params', function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId,
							key: key
						},
						form: {
							'envCode': 'DEV'
						}
					};
					executeMyRequest(params, 'tenant/application/key/config/update', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {
							"code": 172,
							"message": "Missing required field: config"
						});
						done();
					});
				});
				
				it("fail - invalid environment provided", function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId,
							key: key
						},
						form: {
							'envCode': 'INV',
							'config': {
								'mail': {
									'a': 'b'
								},
								'urac': {
									'x': 'y'
								}
							}
						}
					};
					executeMyRequest(params, 'tenant/application/key/config/update', 'post', function (body) {
						assert.deepEqual(body.errors.details[0], {"code": 446, "message": errorCodes[446]});
						done();
					});
				});
				
				it('mongo test', function (done) {
					mongo.findOne('tenants', {"code": "TSTN"}, function (error, records) {
						assert.ifError(error);
						assert.ok(records);
						assert.ok(records.applications);
						assert.equal(records.applications.length, 1);
						assert.equal(records.applications[0].keys.length, 1);
						assert.ok(records.applications[0].keys[0].key);
						assert.ok(records.applications[0].keys[0].config);
						assert.ok(records.applications[0].keys[0].config.dev);
						assert.ok(records.applications[0].keys[0].config.dev.mail);
						assert.ok(records.applications[0].keys[0].config.dev.urac);
						
						assert.deepEqual(records.applications[0].keys[0].config.dev.mail, {
							'a': 'b'
						});
						
						assert.deepEqual(records.applications[0].keys[0].config.dev.urac, {
							'x': 'y'
						});
						done();
					});
				});
			});
			
			describe("list application config", function () {
				it("success - will list configuration", function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId,
							key: key
						}
					};
					executeMyRequest(params, 'tenant/application/key/config/list', 'get', function (body) {
						assert.ok(body.data);
						assert.deepEqual(body.data, {
							dev: {
								mail: {'a': 'b'},
								urac: {'x': 'y'}
							}
						});
						
						done();
					});
				});
				it("fail - wrong key", function (done) {
					var params = {
						qs: {
							id: tenantId,
							appId: applicationId,
							key: 'dfgdfg'
						}
					};
					///// no error msg returned. just empty objct
					executeMyRequest(params, 'tenant/application/key/config/list', 'get', function (body) {
						assert.ok(body);
						console.log(JSON.stringify(body));
						done();
					});
				});
				
			});
		});
		
		describe("Removal of automatically created dashboard tenant keys tests", function () {
			var tenantCode = "DTKT";
			var tenantId, appId, key, tenantExtKey;
			
			function createDashboardTenantKey(cb) {
				var params = {
					form: {
						'code': tenantCode,
						'name': "Dashboard Tenant Key Test",
						'email': "user@soajs.org"
					}
				};
				executeMyRequest(params, 'tenant/add', 'post', function (body) {
					if (body.result === false) {
						assert.ifError(body.result);
					}
					assert.ok(body.data.id);
					tenantId = body.data.id;
					params = {
						qs: {
							"id": tenantId
						},
						form: {
							'description': 'Test Dashboard application',
							'_TTL': '168',
							'productCode': 'DSBRD',
							'packageCode': 'OWNER'
						}
					};
					executeMyRequest(params, 'tenant/application/add', 'post', function (body) {
						assert.ok(body.data.appId);
						appId = body.data.appId;
						params = {
							qs: {
								"id": tenantId,
								"appId": appId
							}
						};
						executeMyRequest(params, 'tenant/application/key/add', 'post', function (body) {
							assert.ok(body.data.key);
							key = body.data.key;
							params = {
								qs: {
									"id": tenantId,
									"appId": appId,
									"key": key
								},
								form: {
									'env': 'all'
								}
							};
							executeMyRequest(params, 'tenant/application/key/ext/add', 'post', function (body) {
								assert.ok(body.data.extKey);
								tenantExtKey = body.data.extKey;
								cb();
							});
						});
					});
				});
			}
			
			function deleteTestingTenantIfExists(cb) {
				mongo.count('tenants', {'code': tenantCode}, function (error, count) {
					assert.ifError(error);
					
					if (count > 0) {
						mongo.remove('tenants', {'code': tenantCode}, function (error) {
							assert.ifError(error);
							cb();
						});
					} else {
						cb();
					}
				});
			}
			
			function deleteTenantUracDataIfExists(cb) {
				uracMongo.count('users', {'tenant.code': tenantCode}, function (error, count) {
					assert.ifError(error);
					
					if (count > 0) {
						uracMongo.remove('users', {'tenant.code': tenantCode}, function (error, data) {
							assert.ifError(error);
							uracMongo.remove('groups', {'tenant.code': tenantCode}, function (error, data) {
								assert.ifError(error);
								cb();
							});
						});
					} else {
						cb();
					}
				});
			}
			
			function checkIfKeyExists(code, cb) {
				mongo.findOne("dashboard_extKeys", {'code': code}, function (error, result) {
					assert.ifError(error);
					if (!result) {
						cb(null, true);
					} else {
						cb(null, false);
					}
				});
			}
			
			beforeEach("remove test tenant if it exists and recreate it", function (done) {
				deleteTestingTenantIfExists(function () {
					deleteTenantUracDataIfExists(function () {
						createDashboardTenantKey(function () {
							done();
						});
					});
				});
			});
			
			it("success - will automatically delete dashboard key when tenant gets deleted", function (done) {
				var params = {
					qs: {
						'id': tenantId
					}
				};
				executeMyRequest(params, 'tenant/delete', 'get', function (body) {
					if (body.result === false)
						assert.ifError(body);
					
					checkIfKeyExists(tenantCode, function (error, deleted) {
						assert.ifError(error);
						assert.ok(deleted);
						assert.equal(deleted, true);
						done();
					});
				});
			});
			
			it("success - will automatically delete dashboard key when application gets deleted", function (done) {
				var params = {
					qs: {
						"id": tenantId,
						"appId": appId
					}
				};
				executeMyRequest(params, 'tenant/application/delete', 'get', function (body) {
					if (body.result === false)
						assert.ifError(body.result);
					
					checkIfKeyExists(tenantCode, function (error, deleted) {
						assert.ifError(error);
						assert.ok(deleted);
						assert.equal(deleted, true);
						done();
					});
				});
			});
			
			it("success - will automatically delete dashboard key when key gets deleted", function (done) {
				var params = {
					qs: {
						"id": tenantId,
						"appId": appId,
						"key": key
					}
				};
				executeMyRequest(params, 'tenant/application/key/delete', 'get', function (body) {
					if (body.result === false)
						assert.ifError(body.result);
					
					checkIfKeyExists(tenantCode, function (error, deleted) {
						assert.ifError(error);
						assert.ok(deleted);
						assert.equal(deleted, true);
						done();
					});
				});
			});
			
			it("success - will automatically delete dashboard key when external key gets deleted", function (done) {
				console.log(tenantExtKey);
				var params = {
					qs: {
						"id": tenantId,
						"appId": appId,
						"key": key
					},
					form: {
						"extKey": tenantExtKey
					}
				};
				executeMyRequest(params, 'tenant/application/key/ext/delete', 'post', function (body) {
					if (body.result === false)
						assert.ifError(body.result);
					
					checkIfKeyExists(tenantCode, function (error, deleted) {
						assert.ifError(error);
						assert.ok(deleted);
						assert.equal(deleted, true);
						done();
					});
				});
			});
		});
	});
	
	describe("login tests", function () {
		var auth;
		it("success - did not specify environment code, old acl", function (done) {
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
				auth = body.soajsauth;
				var params = {
					headers: {
						soajsauth: auth
					}
				};
				executeMyRequest(params, 'permissions/get', 'get', function (body) {
					assert.ok(body.result);
					assert.ok(body.data);
					done();
				});
			});
		});
		
		it("success - did not specify environment code, new acl", function (done) {
			//todo: implement this test case
			done();
		});
		
		it("success - specified environment code, old acl", function (done) {
			var params = {
				headers: {
					soajsauth: auth
				},
				qs: {
					envCode: 'DEV'
				}
			};
			executeMyRequest(params, 'permissions/get', 'get', function (body) {
				assert.ok(body.result);
				assert.ok(body.data);
				done();
			});
		});
	});
	
	describe("testing settings for logged in users", function () {
		var soajsauth;
		
		it("fail - should not work for non-logged in users", function (done) {
			executeMyRequest({}, 'permissions/get', 'get', function (body) {
				console.log(body);
				assert.deepEqual(body.errors.details[0],
					{"code": 601, "message": "No Logged in User found."});
				done();
			});
		});
		
		it("success - should work for logged in users", function (done) {
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
				done();
			});
		});
		
		describe("settings tests", function () {
			var tenantId, applicationId, key, extKey, oauthUserId;
			it("fail - user not logged in", function (done) {
				executeMyRequest({}, 'settings/tenant/get', 'get', function (body) {
					console.log(body);
					assert.deepEqual(body.errors.details[0],
						{"code": 601, "message": "No Logged in User found."});
					done();
				});
			});
			
			it("success - will get tenant", function (done) {
				executeMyRequest({'headers': {'soajsauth': soajsauth}}, 'settings/tenant/get', 'get', function (body) {
					assert.ok(body.result);
					assert.ok(body.data);
					tenantId = body.data.tenant._id.toString();
					done();
				});
			});
			
			it("success - will update tenant", function (done) {
				var params = {
					'headers': {'soajsauth': soajsauth},
					form: {
						"description": 'this is a dummy updated description',
						"name": "test tenant updated"
					}
				};
				executeMyRequest(params, 'settings/tenant/update', 'post', function (body) {
					assert.ok(body.result);
					assert.ok(body.data);
					done();
				});
				
			});
			
			it("success - will add oauth", function (done) {
				var params = {
					'headers': {'soajsauth': soajsauth},
					form: {
						"secret": "my secret key",
						"redirectURI": "http://www.myredirecturi.com/"
					}
				};
				
				executeMyRequest(params, 'settings/tenant/oauth/add/', 'post', function (body) {
					console.log(JSON.stringify(body));
					assert.ok(body.data);
					
					mongo.findOne('tenants', {'code': 'test'}, function (error, tenantRecord) {
						assert.ifError(error);
						assert.deepEqual(tenantRecord.oauth, {
							"secret": "my secret key",
							"redirectURI": "http://www.myredirecturi.com/",
							"grants": ["password", "refresh_token"]
						});
						done();
						
					});
					
				});
			});
			
			it("success - will update oauth", function (done) {
				var params = {
					'headers': {'soajsauth': soajsauth},
					form: {
						"secret": "my secret key2",
						"redirectURI": "http://www.myredirecturi.com/"
					}
				};
				executeMyRequest(params, 'settings/tenant/oauth/update/', 'post', function (body) {
					assert.ok(body.data);
					mongo.findOne('tenants', {'code': 'test'}, function (error, tenantRecord) {
						assert.ifError(error);
						assert.deepEqual(tenantRecord.oauth, {
							"secret": "my secret key2",
							"redirectURI": "http://www.myredirecturi.com/",
							"grants": ["password", "refresh_token"]
						});
						done();
					});
				});
			});
			
			it("success - will get oauth object", function (done) {
				executeMyRequest({'headers': {'soajsauth': soajsauth}}, 'settings/tenant/oauth/list/', 'get', function (body) {
					assert.ok(body.data);
					assert.deepEqual(body.data, {
						"secret": "my secret key2",
						"redirectURI": "http://www.myredirecturi.com/",
						"grants": ["password", "refresh_token"]
					});
					done();
				});
			});
			
			it("success - will delete oauth", function (done) {
				executeMyRequest({'headers': {'soajsauth': soajsauth}}, 'settings/tenant/oauth/delete/', 'get', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			
			it("success - will add oauth user", function (done) {
				var params = {
					'headers': {'soajsauth': soajsauth},
					form: {
						"userId": "oauth_user",
						"password": "password1"
					}
				};
				
				executeMyRequest(params, 'settings/tenant/oauth/users/add/', 'post', function (body) {
					mongo.findOne('oauth_urac', {'userId': 'oauth_user'}, function (error, tenantRecord) {
						assert.ifError(error);
						assert.ok(tenantRecord);
						assert.equal(tenantRecord.userId, "oauth_user");
						assert.equal(tenantRecord.tId.toString(), tenantId);
						oauthUserId = tenantRecord._id.toString();
						done();
					});
				});
			});
			
			it("success - will update oauth users", function (done) {
				var params = {
					'headers': {'soajsauth': soajsauth},
					qs: {
						uId: oauthUserId
					},
					form: {
						"userId": "oauth_user_up",
						"password": "password2"
					}
				};
				executeMyRequest(params, 'settings/tenant/oauth/users/update/', 'post', function (body) {
					assert.ok(body.data);
					mongo.findOne('oauth_urac', {'userId': 'oauth_user_up'}, function (error, tenantRecord) {
						assert.ifError(error);
						assert.ok(tenantRecord);
						assert.equal(tenantRecord.userId, 'oauth_user_up');
						assert.equal(tenantRecord.tId.toString(), tenantId);
						done();
					});
				});
			});
			
			it("success - will delete oauth user", function (done) {
				executeMyRequest({
					'headers': {'soajsauth': soajsauth},
					qs: {'uId': oauthUserId}
				}, 'settings/tenant/oauth/users/delete/', 'get', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			
			it("success - will get oauth users", function (done) {
				executeMyRequest({'headers': {'soajsauth': soajsauth}}, 'settings/tenant/oauth/users/list/', 'get', function (body) {
					assert.ok(body.data);
					assert.equal(body.data.length, 0);
					done();
				});
			});
			
			it("success - will list applications", function (done) {
				applicationId = "5550b473373137a130ebbb68";
				var newApplication = {
					"product": "TPROD",
					"package": "TPROD_BASIC",
					"appId": mongo.ObjectId(applicationId),
					"description": "This is a dummy desc",
					"_TTL": 604800000,
					"keys": []
				};
				var push = {
					'$push': {'applications': newApplication}
				};
				mongo.update('tenants', {'_id': mongo.ObjectId(tenantId)}, push, {
					'upsert': false,
					'safe': true
				}, function (error) {
					assert.ifError(error);
					done();
				});
			});
			
			it("success - will get empty object", function (done) {
				executeMyRequest({'headers': {'soajsauth': soajsauth}}, 'settings/tenant/application/list/', 'get', function (body) {
					assert.ok(body.data);
					assert.equal(body.data.length, 4);
					done();
				});
			});
			
			it("success - will add key", function (done) {
				var params = {
					'headers': {'soajsauth': soajsauth},
					qs: {
						'appId': applicationId
					}
				};
				executeMyRequest(params, 'settings/tenant/application/key/add', 'post', function (body) {
					assert.ok(body.data);
					
					mongo.findOne('tenants', {'_id': mongo.ObjectId(tenantId)}, function (error, tenantRecord) {
						assert.ifError(error);
						assert.ok(tenantRecord);
						key = tenantRecord.applications[tenantRecord.applications.length - 1].keys[0].key.toString();
						done();
					});
				});
			});
			
			it("success - will list key", function (done) {
				var params = {
					'headers': {'soajsauth': soajsauth},
					qs: {
						appId: applicationId
					}
				};
				executeMyRequest(params, 'settings/tenant/application/key/list/', 'get', function (body) {
					assert.ok(body.data);
					assert.equal(body.data.length, 1);
					key = body.data[0].key.toString();
					done();
				});
			});
			
			it("success - will add ext key", function (done) {
				var params = {
					'headers': {'soajsauth': soajsauth},
					qs: {
						appId: applicationId,
						key: key
					},
					form: {
						'expDate': expDateValue,
						'device': {
							'a': 'b'
						},
						'geo': {
							'x': 'y'
						},
						'env': 'DASHBOARD'
					}
				};
				executeMyRequest(params, 'settings/tenant/application/key/ext/add/', 'post', function (body) {
					console.log(JSON.stringify(body));
					assert.ok(body.data);
					mongo.findOne('tenants', {'_id': mongo.ObjectId(tenantId)}, function (error, tenantRecord) {
						assert.ifError(error);
						assert.ok(tenantRecord);
						extKey = tenantRecord.applications[tenantRecord.applications.length - 1].keys[0].extKeys[0].extKey;
						done();
					});
				});
			});
			
			it("success - will update ext key", function (done) {
				var params = {
					'headers': {'soajsauth': soajsauth},
					qs: {
						appId: applicationId,
						key: key
					},
					form: {
						'extKey': extKey,
						'expDate': expDateValue,
						'device': {
							'a': 'b'
						},
						'geo': {
							'x': 'y'
						}
					}
				};
				executeMyRequest(params, 'settings/tenant/application/key/ext/update/', 'post', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			
			it("success - will delete ext key", function (done) {
				var params = {
					'headers': {'soajsauth': soajsauth},
					qs: {
						appId: applicationId,
						key: key
					},
					form: {
						'extKey': extKey
					}
				};
				executeMyRequest(params, 'settings/tenant/application/key/ext/delete/', 'post', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			
			it("success - will list ext key", function (done) {
				var params = {
					'headers': {'soajsauth': soajsauth},
					qs: {
						appId: applicationId,
						key: key
					}
				};
				executeMyRequest(params, 'settings/tenant/application/key/ext/list/', 'get', function (body) {
					assert.ok(body.data);
					assert.equal(body.data.length, 0);
					
					done();
				});
			});
			
			it("success - will update configuration", function (done) {
				var params = {
					'headers': {'soajsauth': soajsauth},
					qs: {
						appId: applicationId,
						key: key
					},
					form: {
						'envCode': 'DEV',
						'config': {
							'mail': {
								'a': 'b'
							},
							'urac': {
								'x': 'y'
							}
						}
					}
				};
				executeMyRequest(params, 'settings/tenant/application/key/config/update', 'post', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			
			it("success - will list configuration", function (done) {
				var params = {
					'headers': {'soajsauth': soajsauth},
					qs: {
						appId: applicationId,
						key: key
					}
				};
				executeMyRequest(params, 'settings/tenant/application/key/config/list', 'get', function (body) {
					assert.ok(body.data);
					assert.deepEqual(body.data, {
						dev: {
							mail: {'a': 'b'},
							urac: {'x': 'y'}
						}
					});
					
					done();
				});
			});
			
			it("success - will delete key", function (done) {
				var params = {
					'headers': {'soajsauth': soajsauth},
					qs: {
						'appId': applicationId,
						'key': key.toString()
					}
				};
				executeMyRequest(params, 'settings/tenant/application/key/delete', 'get', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			
		});
	});
	
	describe("hosts tests", function () {
		var hosts = [], hostsCount = 0;
		describe("list Hosts", function () {
			
			it("success - will get hosts list", function (done) {
				executeMyRequest({qs: {'env': 'dev'}}, 'hosts/list', 'get', function (body) {
					assert.ok(body.data);
					hostsCount = body.data.hosts.length;
					done();
				});
			});
			
			it("mongo - empty the hosts", function (done) {
				mongo.find('hosts', {}, function (error, dbHosts) {
					assert.ifError(error);
					assert.ok(dbHosts);
					dbHosts.forEach(function (oneHost) {
						oneHost.hostname = oneHost.name;
					});
					hosts = dbHosts;
					mongo.remove('hosts', {}, function (error) {
						assert.ifError(error);
						done();
					});
				});
			});
			
			it("success - will get an empty list", function (done) {
				executeMyRequest({qs: {'env': 'dev'}}, 'hosts/list', 'get', function (body) {
					console.log(body.data);
					console.log("=========");
					assert.ok(body.data);
					assert.equal(body.data.hosts.length, 0);
					done();
				});
			});
			
			it("mongo - fill the hosts", function (done) {
				mongo.remove('hosts', {}, function (error) {
					assert.ifError(error);
					mongo.insert('hosts', hosts, function (error) {
						assert.ifError(error);
						done();
					});
				});
			});
			
			it("success - will get hosts list", function (done) {
				executeMyRequest({qs: {'env': 'dev'}}, 'hosts/list', 'get', function (body) {
					assert.ok(body.data);
					assert.ok(body.data.hosts.length > 0);
					assert.equal(body.data.hosts.length, hostsCount);
					done();
				});
			});
		});
		
		describe("maintenance operation Hosts", function () {
			//afterEach(function(done){
			//	setTimeout(function(){ done(); }, 1000);
			//});
			
			it("fail - missing params", function (done) {
				var params = {
					form: {
						'env': 'dev',
						'serviceName': 'controller',
						'servicePort': 4000,
						'operation': 'heartbeat'
					}
				};
				executeMyRequest(params, 'hosts/maintenanceOperation', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {
						"code": 172,
						"message": "Missing required field: hostname"
					});
					done();
				});
			});
			
			it("fail - error calling awareness on service", function (done) {
				var params = {
					form: {
						'env': 'dev',
						'serviceName': 'dashboard',
						'hostname': 'dashboard',
						'servicePort': 4003,
						'operation': 'awarenessStat',
						'serviceHost': '127.0.0.1'
					}
				};
				executeMyRequest(params, 'hosts/maintenanceOperation', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {
						"code": 602,
						"message": "Invalid maintenance operation requested."
					});
					done();
				});
			});
			
			it("fail - error calling load provision on controller", function (done) {
				var params = {
					form: {
						'env': 'dev',
						'serviceName': 'controller',
						'servicePort': 4003,
						'hostname': 'controller',
						'operation': 'loadProvision',
						'serviceHost': '127.0.0.1'
					}
				};
				executeMyRequest(params, 'hosts/maintenanceOperation', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {
						"code": 602,
						"message": "Invalid maintenance operation requested."
					});
					done();
				});
			});
			
			it("fail - host not found", function (done) {
				var params = {
					form: {
						'env': 'dev',
						'serviceName': 'dashboard',
						'servicePort': 4003,
						'hostname': 'dashboard2',
						'operation': 'heartbeat',
						'serviceHost': '128.0.0.1'
					}
				};
				executeMyRequest(params, 'hosts/maintenanceOperation', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {"code": 605, "message": "Service Host not found."});
					done();
				});
			});
			
			it("fail - service not found", function (done) {
				var params = {
					form: {
						'env': 'dev',
						'serviceName': 'invalidService',
						'servicePort': 4000,
						'hostname': 'invalidService',
						'operation': 'heartbeat',
						'serviceHost': '127.0.0.1'
					}
				};
				executeMyRequest(params, 'hosts/maintenanceOperation', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {"code": 604, "message": "Service not found."});
					done();
				});
			});
			
			it("success - heartbeat controller and service", function (done) {
				var params = {
					form: {
						'env': 'dev',
						'serviceName': 'controller',
						'servicePort': 4000,
						'operation': 'heartbeat',
						'hostname': 'controller',
						'serviceHost': '127.0.0.1'
					}
				};
				executeMyRequest(params, 'hosts/maintenanceOperation', 'post', function (body) {
					assert.ok(body.data);
					
					params.form.serviceName = 'dashboard';
					params.form.hostname = 'dashboard';
					params.form.servicePort = 4003;
					executeMyRequest(params, 'hosts/maintenanceOperation', 'post', function (body) {
						assert.ok(body.data);
						done();
					});
				});
			});
			
			it("success - awareness on controller", function (done) {
				var params = {
					form: {
						'env': 'dev',
						'serviceName': 'controller',
						'hostname': 'controller',
						'servicePort': 4000,
						'operation': 'awarenessStat',
						'serviceHost': '127.0.0.1'
					}
				};
				executeMyRequest(params, 'hosts/maintenanceOperation', 'post', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			
			it("success - load provision service", function (done) {
				var params = {
					form: {
						'env': 'dev',
						'serviceName': 'dashboard',
						'hostname': 'dashboard',
						'servicePort': 4003,
						'operation': 'loadProvision',
						'serviceHost': '127.0.0.1'
					}
				};
				executeMyRequest(params, 'hosts/maintenanceOperation', 'post', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			
			it("fail - getting service logs", function (done) {
				var params = {
					"form": {
						"serviceName": "dashboard",
						"servicePort": 4003,
						"hostname": "dashboard",
						"operation": "hostLogs",
						"env": "dev"
					}
				};
				executeMyRequest(params, "hosts/maintenanceOperation", "post", function (body) {
					assert.ok(!body.result);
					assert.deepEqual(body.errors.details[0], {"code": 619, "message": errorCodes[619]});
					done();
				});
			});
			
		});
		
		describe("deployment manual tests", function () {
			it("deploy controller", function (done) {
				executeMyRequest({
					'qs': {},
					form: {'envCode': 'DEV', 'number': 1}
				}, 'hosts/deployController', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {
						"code": 618,
						"message": "The Deployer of this environment is configured to be manual. Deploy and Start the services then refresh this section."
					});
					done();
				});
			});
			
			it("deploy service", function (done) {
				executeMyRequest({'form': {'envCode': 'DEV'}}, 'hosts/deployService', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {
						"code": 618,
						"message": "The Deployer of this environment is configured to be manual. Deploy and Start the services then refresh this section."
					});
					done();
				});
			});
		});
		
		describe("remove Hosts", function () {
			it('success - will remove host', function (done) {
				executeMyRequest({
					qs: {
						'env': 'dev',
						'hostname': hosts[0].hostname,
						'name': hosts[0].name,
						'ip': hosts[0].ip
					}
				}, 'hosts/delete', 'get', function (body) {
					assert.ok(body.data);
					done();
				});
			});
		});
	});
	
	describe("platforms tests", function () {
		
		describe("list platforms", function () {
			
			it("success - will list platforms and available certificates", function (done) {
				var params = {
					qs: {
						env: 'DEV'
					}
				};
				
				executeMyRequest(params, "environment/platforms/list", 'get', function (body) {
					assert.ok(body.data);
					assert.ok(Object.keys(body.data).length > 0);
					done();
				});
			});
			
			it("fail - missing required params", function (done) {
				executeMyRequest({}, "environment/platforms/list", 'get', function (body) {
					assert.ok(body.errors);
					assert.deepEqual(body.errors.details[0], {'code': 172, 'message': 'Missing required field: env'});
					done();
				});
			});
		});
		
		describe("add drivers", function () {
			
			it("success - will add a docker machine local driver", function (done) {
				var params = {
					qs: {
						env: 'DEV',
						driverName: 'dockermachine - local'
					},
					form: {
						local: {
							host: '127.0.0.1',
							port: 5354,
							config: {}
						}
					}
				};
				
				executeMyRequest(params, 'environment/platforms/driver/add', 'post', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			
			it("success - will add a docker machine cloud driver", function (done) {
				var params = {
					qs: {
						env: 'DEV',
						driverName: 'dockermachine - cloud'
					},
					form: {
						cloud: {
							host: 'docker.rackspace.com',
							port: 2376,
							config: {},
							cloudProvider: 'rackspace'
						}
					}
				};
				
				executeMyRequest(params, 'environment/platforms/driver/add', 'post', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			
			it("success - will add a docker socket driver", function (done) {
				var params = {
					qs: {
						env: 'DEV',
						driverName: 'docker - socket'
					},
					form: {
						socket: {
							socketPath: '/var/run/docker.sock'
						}
					}
				};
				
				executeMyRequest(params, 'environment/platforms/driver/add', 'post', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			
			it("fail - missing required params", function (done) {
				var params = {
					qs: {
						env: 'DEV'
					},
					form: {
						local: {
							host: '127.0.0.1',
							port: 5354,
							config: {}
						}
					}
				};
				
				executeMyRequest(params, 'environment/platforms/driver/add', 'post', function (body) {
					assert.ok(body.errors);
					assert.deepEqual(body.errors.details[0], {
						'code': 172,
						'message': 'Missing required field: driverName'
					});
					done();
				});
			});
		});
		
		describe("edit drivers", function () {
			
			it("success - will update a docker machine local driver", function (done) {
				var params = {
					qs: {
						env: 'DEV',
						driverName: 'dockermachine - local'
					},
					form: {
						local: {
							host: '192,168.99.103',
							port: 2376,
							config: {}
						}
					}
				};
				
				executeMyRequest(params, 'environment/platforms/driver/edit', 'post', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			
			it("success - will update a docker machine cloud driver", function (done) {
				var params = {
					qs: {
						env: 'DEV',
						driverName: 'dockermachine - cloud'
					},
					form: {
						cloud: {
							host: 'docker.joyent.com',
							port: 2376,
							config: {},
							cloudProvider: 'joyent'
						}
					}
				};
				
				executeMyRequest(params, 'environment/platforms/driver/edit', 'post', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			
			it("success - will update a docker socket driver", function (done) {
				var params = {
					qs: {
						env: 'DEV',
						driverName: 'docker - socket'
					},
					form: {
						socket: {
							socketPath: '/var/run/dockerSock.sock'
						}
					}
				};
				
				executeMyRequest(params, 'environment/platforms/driver/edit', 'post', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			
			it("fail - missing required params", function (done) {
				var params = {
					qs: {
						driverName: 'dockermachine - cloud'
					},
					form: {
						cloud: {
							host: 'docker.joyent.com',
							port: 2376,
							config: {},
							cloudProvider: 'joyent'
						}
					}
				};
				
				executeMyRequest(params, 'environment/platforms/driver/edit', 'post', function (body) {
					assert.ok(body.errors);
					assert.deepEqual(body.errors.details[0], {'code': 172, 'message': 'Missing required field: env'});
					done();
				});
			});
		});
		
		describe("change selected driver", function () {
			
			it("success - will change selected driver", function (done) {
				var params = {
					qs: {
						env: 'DEV'
					},
					form: {
						selected: 'container.dockermachine.cloud.joyent'
					}
				};
				
				executeMyRequest(params, 'environment/platforms/driver/changeSelected', 'post', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			
			it("fail - missing required params", function (done) {
				var params = {
					form: {
						selected: 'container.dockermachine.cloud.joyent'
					}
				};
				
				executeMyRequest(params, 'environment/platforms/driver/changeSelected', 'post', function (body) {
					assert.ok(body.errors);
					assert.deepEqual(body.errors.details[0], {'code': 172, 'message': 'Missing required field: env'});
					done();
				});
			});
		});
		
		describe("change deployer type", function () {
			
			it("success - will change deployer type", function (done) {
				var params = {
					qs: {
						env: 'DEV'
					},
					form: {
						deployerType: 'container'
					}
				};
				
				executeMyRequest(params, 'environment/platforms/deployer/type/change', 'post', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			
			it("fail - missing required params", function (done) {
				var params = {
					qs: {
						env: 'DEV'
					}
				};
				
				executeMyRequest(params, 'environment/platforms/deployer/type/change', 'post', function (body) {
					assert.ok(body.errors);
					assert.deepEqual(body.errors.details[0], {
						'code': 172,
						'message': 'Missing required field: deployerType'
					});
					done();
				});
			});
		});
		
		describe("delete drivers", function () {
			
			it("success - will delete local driver", function (done) {
				var params = {
					qs: {
						env: 'DEV',
						driverName: 'dockermachine - local'
					}
				};
				
				executeMyRequest(params, 'environment/platforms/driver/delete', 'get', function (body) {
					assert.ok(body.data);
					done();
				});
			});
			
			it("fail - trying to delete the driver that is currently selected", function (done) {
				var params = {
					qs: {
						env: 'DEV',
						driverName: 'dockermachine - cloud - joyent'
					}
				};
				
				executeMyRequest(params, 'environment/platforms/driver/delete', 'get', function (body) {
					assert.ok(body.errors);
					assert.deepEqual(body.errors.details[0], {
						'code': 737,
						'message': 'You are not allowed to delete a driver that is currently selected'
					});
					done();
				});
			});
			
			it("success - will delete cloud driver after removing selection", function (done) {
				var params = {
					qs: {
						env: 'DEV'
					},
					form: {
						selected: 'container.dockermachine.local'
					}
				};
				executeMyRequest(params, 'environment/platforms/driver/changeSelected', 'post', function (body) {
					assert.ok(body.data);
					
					params = {
						qs: {
							env: 'DEV',
							driverName: 'dockermachine - cloud - joyent'
						}
					};
					
					executeMyRequest(params, 'environment/platforms/driver/delete', 'get', function (body) {
						assert.ok(body.data);
						done();
					});
				});
			});
		});
		
	});
	
	describe('mongo check db', function () {
		it('asserting environment record', function (done) {
			mongo.findOne('environment', {"code": "DEV"}, function (error, record) {
				assert.ifError(error);
				assert.ok(record);
				delete record._id;
				assert.deepEqual(record, {
					"code": "DEV",
					"domain": "api.myDomain.com",
					"port": 8080,
					"profile": process.env.SOAJS_ENV_WORKDIR + 'soajs/FILES/profiles/single.js',
					"deployer": {
						"type": "container",
						"selected": "container.dockermachine.local",
						"container": {
							"dockermachine": {
								"local": {},
								"cloud": {
									"joyent": {}
								}
							},
							"docker": {
								"socket": {},
								"scoket": {
									"socketPath": "/var/run/dockerSock.sock"
								}
							}
						}
					},
					"description": "this is a dummy description",
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
								"autoRelaodRegistry": 300000,
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
								"src": true,
								"level": "debug"
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
								"rolling": false,
								"unset": "keep",
								"cookie": {
									"path": "/",
									"httpOnly": true,
									"secure": false,
									"domain": "soajs.com",
									"maxAge": null
								},
								"resave": false,
								"saveUninitialized": false
							}
						}
					},
					"dbs": {
						"clusters": {
							"cluster1": {
								"URLParam": {
									"connectTimeoutMS": 0,
									"socketTimeoutMS": 0,
									"maxPoolSize": 5,
									"wtimeoutMS": 0,
									"slaveOk": true
								},
								"servers": [
									{
										"host": "127.0.0.1",
										"port": 27017
									}
								],
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
							"session": {
								"cluster": "cluster1",
								"name": "core_session",
								"store": {},
								"collection": "sessions",
								"stringify": false,
								"expireAfter": 1209600000
							},
							"prefix": ""
						},
						"databases": {
							"urac": {
								"cluster": "cluster1",
								"tenantSpecific": true
							}
						}
					}
				});
				done();
			});
		});
		
		it('asserting product record', function (done) {
			mongo.findOne('products', {"code": "TPROD"}, function (error, record) {
				assert.ifError(error);
				assert.ok(record);
				delete record._id;
				console.log("************************");
				console.log(record);
				console.log("************************");
				assert.deepEqual(record, {
					"code": "TPROD",
					"name": "test product updated",
					"description": "this is a dummy updated description",
					"packages": [
						{
							"code": "TPROD_BASIC",
							"name": "basic package 2",
							"description": "this is a dummy updated description",
							"acl": {
								"dev": {
									"urac": {
										'access': false,
										'apis': {
											'/account/changeEmail': {
												'access': true
											}
										}
									}
									//todo: retest this after fixing inputmask data type conversion
									//,
									//'apisRegExp': [
									//	{
									//		'regExp': /admin\/.*/,
									//		'access': ['admin']
									//	}
									//]
								}
							},
							"_TTL": 24 * 3600 * 1000
						}
					]
				});
				done();
			});
		});
		
		it('asserting tenant record', function (done) {
			//TSTN
			mongo.findOne('tenants', {"code": 'TSTN'}, function (error, record) {
				assert.ifError(error);
				assert.ok(record);
				delete record._id;
				delete record.applications[0].appId;
				
				assert.ok(record.applications[0].keys[0].key);
				delete record.applications[0].keys[0].key;
				
				assert.ok(record.applications[0].keys[0].extKeys[0].extKey);
				delete record.applications[0].keys[0].extKeys[0].extKey;
				
				assert.ok(record.applications[0].keys[0].extKeys[1].extKey);
				delete record.applications[0].keys[0].extKeys[1].extKey;
				
				assert.deepEqual(record.oauth, {
					"secret": "my secret key",
					"redirectURI": "http://www.myredirecturi.com/",
					"grants": [
						"password", "refresh_token"
					]
				});
				delete record.oauth;
				assert.deepEqual(record.applications, [
					{
						"product": "TPROD",
						"package": "TPROD_BASIC",
						"description": "this is a dummy description",
						//"acl": {
						//	"urac": {
						//		'access': false,
						//		'apis': {
						//			'/account/changeEmail': {
						//				'access': true
						//			}
						//		}
						//	}
						//},
						"_TTL": 12 * 3600 * 1000,
						"acl": {
							'dev': {
								'example01': {
									"access": ["user"],
									"apis": {}
								}
							},
							'dashboard': {
								'urac': {
									"access": false,
									"apis": {
										"/account/changeEmail": {
											"access": true
										}
									}
								},
								'dashboard': {
									"access": ["owner"],
									"apis": {}
								}
							}
						},
						"keys": [
							{
								"extKeys": [
									{
										"expDate": new Date(expDateValue).getTime() + config.expDateTTL,
										"device": {'a': 'b'},
										"geo": {'x': 'y'},
										"env": 'DEV'
									},
									{
										"expDate": new Date(expDateValue).getTime() + config.expDateTTL,
										"device": {'a': 'b'},
										"geo": {'x': 'y'},
										"env": 'DASHBOARD'
									}
								],
								"config": {
									"dev": {
										"mail": {
											"a": "b"
										},
										"urac": {
											'x': 'y'
										}
									}
								}
							}
						]
					}
				]);
				delete record.applications;
				assert.deepEqual(record, {
					"code": "TSTN",
					"name": "test tenant",
					"description": "this is a dummy description",
					"type": "client"
				});
				done();
			});
		});
	});
	
	describe("change tenant security key", function () {
		
		it("success - will change tenant security key", function (done) {
			
			mongo.findOne('environment', {'code': 'DEV'}, function (error, envRecord) {
				assert.ifError(error);
				assert.ok(envRecord);
				var params = {
					qs: {
						'id': envRecord._id.toString()
					},
					form: {
						'algorithm': 'aes256',
						'password': 'new test case password'
					}
				};
				executeMyRequest(params, 'environment/key/update', 'post', function (body) {
					console.log(JSON.stringify(body));
					assert.ok(body.data);
					assert.ok(body.data.newKey);
					done();
				});
			});
		});
	});
	
	describe("prevent operator from removing tenant/application/key/extKey/product/package he is currently logged in with", function () {
		var tenantId, appId, key, tenantExtKey, productCode, productId, packageCode, params;
		
		before(function (done) {
			//get tenant/product info from db
			mongo.findOne('tenants', {'code': "test"}, function (error, record) {
				assert.ifError(error);
				assert.ok(record);
				tenantId = record._id.toString();
				appId = record.applications[0].appId.toString();
				key = record.applications[0].keys[0].key;
				tenantExtKey = record.applications[0].keys[0].extKeys[0].extKey;
				productCode = record.applications[0].product;
				packageCode = record.applications[0].package;
				
				mongo.findOne('products', {'code': productCode}, function (error, record) {
					assert.ifError(error);
					assert.ok(record);
					productId = record._id.toString();
					
					done();
				});
			});
		});
		
		it("success - prevent from deleting tenant", function (done) {
			params = {
				qs: {
					"id": tenantId
				}
			};
			
			executeMyRequest(params, 'tenant/delete', 'get', function (body) {
				assert.ok(body);
				if (body.result === false)
					assert.ifError(body.result);
				
				assert.deepEqual(body.errors.details[0], {"code": 462, "message": errorCodes[462]});
				done();
			});
		});
		
		it("success - prevent from deleting application", function (done) {
			params = {
				qs: {
					"id": tenantId,
					"appId": appId
				}
			};
			executeMyRequest(params, 'tenant/application/delete', 'get', function (body) {
				assert.ok(body);
				if (body.result === false)
					assert.ifError(body.result);
				
				assert.deepEqual(body.errors.details[0], {"code": 463, "message": errorCodes[463]});
				done();
			});
		});
		
		it("success - prevent from deleting key", function (done) {
			params = {
				qs: {
					"id": tenantId,
					"appId": appId,
					"key": key
				}
			};
			executeMyRequest(params, 'tenant/application/key/delete', 'get', function (body) {
				assert.ok(body);
				if (body.result === false)
					assert.ifError(body.result);
				
				assert.deepEqual(body.errors.details[0], {"code": 464, "message": errorCodes[464]});
				done();
			});
		});
		
		it("success - prevent from deleting extKey", function (done) {
			params = {
				qs: {
					"id": tenantId,
					"appId": appId,
					"key": key
				},
				form: {
					"extKey": tenantExtKey
				}
			};
			executeMyRequest(params, 'tenant/application/key/ext/delete', 'post', function (body) {
				assert.ok(body);
				if (body.result === false)
					assert.ifError(body.result);
				
				assert.deepEqual(body.errors.details[0], {"code": 465, "message": errorCodes[465]});
				done();
			});
		});
		
		it("success - prevent from deleting product", function (done) {
			params = {
				qs: {
					'id': productId
				}
			};
			executeMyRequest(params, 'product/delete', 'get', function (body) {
				assert.ok(body);
				if (body.result === false)
					assert.ifError(body.result);
				
				assert.deepEqual(body.errors.details[0], {"code": 466, "message": errorCodes[466]});
				done();
			});
		});
		
		it("success - prevent from deleting package", function (done) {
			params = {
				qs: {
					'id': productId,
					'code': packageCode.split("_")[1]
				}
			};
			executeMyRequest(params, 'product/packages/delete', 'get', function (body) {
				assert.ok(body);
				if (body.result === false)
					assert.ifError(body.result);
				
				assert.deepEqual(body.errors.details[0], {"code": 467, "message": errorCodes[467]});
				done();
			});
		});
	});
});