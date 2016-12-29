"use strict";
var fs = require("fs");
var Docker = require('dockerode');
var utils = require("soajs/lib/utils");
var Grid = require('gridfs-stream');
var fs = require('fs');
var rimraf = require('rimraf');
var async = require('async');

var dockerColl = 'docker';
var gridfsColl = 'fs.files';

function checkError(error, cb, fCb) {
	if (error) {
		return cb(error, null);
	}
	return fCb();
}

function getDockerCerts(certs, gfs, db, cb) {
	var certBuffers = {};
	async.each(certs, function (oneCert, callback) {
		var gs = new gfs.mongo.GridStore(db, oneCert._id, 'r', { //TODO: update to support model injection
			root: 'fs',
			w: 1,
			fsync: true
		});

		gs.open(function (error, gstore) {
			checkError(error, callback, function () {
				gstore.read(function (error, filedata) {
					checkError(error, callback, function () {
						gstore.close();

						var certName = oneCert.filename.split('.')[0];
						certBuffers[oneCert.metadata.certType] = filedata;
						return callback(null, true);
					});
				});
			});
		});
	}, function (error, result) {
		checkError(error, cb, function () {
			return cb(null, certBuffers);
		});
	});
}

var lib = {
	"getDeployer": function (soajs, deployerConfig, model, cb) {
		/**
		 Three options:
		 - local: use socket port
		 - remote: get fastest manager node and use it
		 - remote and target: get deployer for target node
		 */
		var config = utils.cloneObj(deployerConfig);
		var docker;

		if (config.socketPath) {
			docker = new Docker({socketPath: config.socketPath});
			return cb(null, docker);
		}

		getClusterCertificates(config, function (error, certs) {
			checkError(error, cb, function () {

				if (config.flags && (config.flags.newNode || config.flags.targetNode)) {
					getTargetNode(config, function (error, target) {
						checkError(error, cb, function () {
							var dockerConfig = buildDockerConfig(target.host, target.port, certs);
							docker = new Docker(dockerConfig);
							return cb(null, docker);
						});
					});
				}
				else {
					return getManagerNodeDeployer(config, certs, cb);
				}
			});
		});


		function getTargetNode(config, callback) {
			if (!config.host || !config.port) {
				return callback({message: 'Missing host/port info'});
			}
			return callback(null, {host: config.host, port: config.port});
		}

		function getManagerNodeDeployer(config, certs, cb) {
			if (!config.nodes || config.nodes.length === 0) {
				return cb({message: 'No manager nodes found in this environment\'s deployer'});
			}

			var opts = {
				collection: dockerColl,
				conditions: { recordType: 'node', role: 'manager' }
			};

			model.findEntries(soajs, opts, function (error, managerNodes) {
				checkError(error, cb, function () {
					async.detect(managerNodes, function (oneNode, callback) {
						var dockerConfig = buildDockerConfig(oneNode.ip, oneNode.dockerPort, certs);
						var docker = new Docker(dockerConfig);
						docker.ping(function (error, response) {
							//error is insignificant in this case
							return callback(null, response);
						});
					}, function (error, fastestNodeRecord) {
						//error is insignificant in this case
						if (!fastestNodeRecord) {
							return cb({'message': 'ERROR: unable to connect to a manager node'});
						}
						var dockerConfig = buildDockerConfig(fastestNodeRecord.ip, fastestNodeRecord.dockerPort, certs);
						var docker = new Docker(dockerConfig);
						return cb(null, docker);
					});
				});
			});
		}

		function buildDockerConfig(host, port, certs) {
			var dockerConfig = {
				host: host,
				port: port
			};

			var certKeys = Object.keys(certs);
			certKeys.forEach(function (oneCertKey) {
				dockerConfig[oneCertKey] = certs[oneCertKey];
			});

			return dockerConfig;
		}

		function getClusterCertificates(config, callback) {
			if (!config.envCode) {
				return callback({message: 'Missing environment code'});
			}

			var opts = {
				collection: gridfsColl,
				conditions: {}
			};
			opts.conditions['metadata.env.' + config.envCode.toUpperCase()] = config.selectedDriver;
			model.findEntries(soajs, opts, function (error, certs) {
				checkError(error, callback, function () {
					if (!certs || (certs && certs.length === 0)) {
						return callback({
							code: 741,
							message: 'No certificates for ' + config.envCode + ' environment found'
						});
					}

					model.getDb(soajs).getMongoDB(function (error, db) {
						checkError(error, callback, function () {

							var gfs = Grid(db, model.getDb(soajs).mongodb);
							var counter = 0;
							return getDockerCerts(certs, gfs, db, callback);
						});
					});
				});
			});
		}
	}
};
var deployer = {

	"addNode": function (soajs, deployerConfig, options, model, cb) {
		deployerConfig.flags = {
			newNode: true
		};

		var nodeInfo = {};
		lib.getDeployer(soajs, deployerConfig, model, function (error, deployer) {
			checkError(error, cb, function () {
				deployer.info(function (error, nodeInfo) {
					checkError(error, cb, function () {
						deployer.swarmJoin(options, function (error) {
							checkError(error, cb, function () {
								if (options.role === 'manager') {
									var node = deployer.getNode(nodeInfo.Name);
									node.inspect(function (error, node) {
										nodeInfo = {
											role: 'manager',
											name: node.Description.Hostname
										};

										return cb(null, node, nodeInfo);
									});
								}
								else {
									//get manager node from swarm and inspect newly added node
									delete deployerConfig.flags;
									delete deployerConfig.host;
									delete deployerConfig.port;

									lib.getDeployer(soajs, deployerConfig, model, function (error, deployer) {
										checkError(error, cb, function () {
											deployer.listNodes(function (error, nodes) {
												checkError(error, cb, function () {
													for (var i = 0; i < nodes.length; i++) {
														if (nodes[i].Description.Hostname === nodeInfo.Name) {

															nodeInfo = {
																role: 'worker',
																name: nodes[i].Description.Hostname
															};

															return cb(null, nodes[i]);
														}
													}
													return cb();
												});
											});
										});
									});
								}
							});
						});
					});
				});
			});
		});
	},

	"removeNode": function (soajs, deployerConfig, options, model, cb, backgroundCB) {
		/*
		 - get deployer for target node
		 - leave swarm
		 - return success response
		 - get deployer of a manager node in the swarm
		 - remove node
		 */

		var targetDeployerConfig = JSON.parse(JSON.stringify(deployerConfig));
		targetDeployerConfig.host = options.ip;
		targetDeployerConfig.port = options.dockerPort;
		targetDeployerConfig.flags = {targetNode: true};
		lib.getDeployer(soajs, targetDeployerConfig, model, function (error, targetDeployer) {
			checkError(error, cb, function () {
				targetDeployer.swarmLeave(function (error) {
					checkError(error, cb, function () {

						//return response and remove node entry from swarm in the background
						cb(null, true);

						lib.getDeployer(soajs, deployerConfig, model, function (error, deployer) {
							var node = deployer.getNode(options.id);
							setTimeout(function () {
								node.remove(backgroundCB);
							}, 20000);
						});
					});
				});
			});
		});
	},

	"updateNode": function (soajs, deployerConfig, options, model, cb) {
		lib.getDeployer(soajs, deployerConfig, model, function (error, deployer) {
			checkError(error, cb, function () {
				var node = deployer.getNode(options.nodeId);

				//need to inspect node in order to get its current version and pass it to update call
				node.inspect(function (error, nodeRecord) {
					checkError(error, cb, function () {
						options.version = nodeRecord.Version.Index;
						node.update(options, function (error, result) {
							checkError(error, cb, function () {
								return cb(null, true);
							});
						});
					});
				});
			});
		});
	},

	"buildNodeRecord": function (soajs, deployerConfig, options, model, cb) {
		var record = {
			recordType: 'node',
			id: options.node.ID,
			name: options.node.Description.Hostname,
			availability: options.node.Spec.Availability,
			role: options.node.Spec.Role,
			resources: {
				cpuCount: options.node.Description.Resources.NanoCPUs / 1000000000,
				memory: options.node.Description.Resources.MemoryBytes
			},
			tokens: options.managerNodes[0].tokens
		};

		if (record.role === 'manager') {
			record.ip = options.node.ManagerStatus.Addr.split(':')[0];
			record.dockerPort = soajs.inputmaskData.port;
			record.swarmPort = options.node.ManagerStatus.Addr.split(':')[1];
		}
		else {
			record.ip = soajs.inputmaskData.host;
			record.dockerPort = soajs.inputmaskData.port;
			record.swarmPort = options.swarmPort;
		}
		return cb(record);
	},

	"deployHAService": function (soajs, deployerConfig, options, model, cb) {
		var haServiceParams = {
			"env": options.context.dockerParams.env,
			"Name": options.context.dockerParams.env + '-' + options.context.dockerParams.name,
			"TaskTemplate": {
				"ContainerSpec": {
					"Image": soajs.inputmaskData.imagePrefix + '/' + ((options.context.origin === 'service' || options.context.origin === 'controller') ? options.config.images.services : options.config.images.nginx),
					"Env": options.context.dockerParams.variables,
					"Dir": options.config.imagesDir,
					"Command": [options.context.dockerParams.Cmd[0]],
					"Args": options.context.dockerParams.Cmd.splice(1)
				},
				"Resources": {
					"Limits": {
						"MemoryBytes": soajs.inputmaskData.memoryLimit
					}
				},
				"RestartPolicy": {
					"Condition": "any",
					"MaxAttempts": 5
				}
			},
			"Mode": {
				"Replicated": {
					"Replicas": soajs.inputmaskData.haCount
				}
			},
			"UpdateConfig": {
				"Delay": 500.0,
				"Parallelism": 2,
				"FailureAction": "pause"
			},
			"Networks": [{Target: 'soajsnet'}],
			"Labels": {
				"soajs.env": options.context.dockerParams.env,
				"soajs.service": options.context.dockerParams.name,
			}
		};

		haServiceParams.TaskTemplate.ContainerSpec.Env.push('SOAJS_DEPLOY_HA=true');

		if (options.context.origin === 'service' || options.context.origin === 'controller') {
			haServiceParams.Name += '-v' + soajs.inputmaskData.version;
			haServiceParams.TaskTemplate.ContainerSpec.Mounts = [
				{
					"Type": "bind",
					"ReadOnly": true,
					"Source": "/var/run/docker.sock",
					"Target": "/var/run/docker.sock",
				}
			];
		}
		else if (options.context.origin === 'nginx') {
			haServiceParams.EndpointSpec = {
				"Mode": "vip",
				"Ports": [
					{
						"Protocol": "tcp",
						"PublishedPort": soajs.inputmaskData.exposedPort || Math.floor((Math.random() * 100) + 81),
						"TargetPort": 80
					}
				]
			};
		}

		if (process.env.SOAJS_TEST) {
			//using lightweight image and commands to optimize travis builds
			//the purpose of travis builds is to test the dashboard api, not the docker containers
			haServiceParams.TaskTemplate.ContainerSpec.Image = 'alpine:latest';
			haServiceParams.TaskTemplate.ContainerSpec.Command = ['sh'];
			haServiceParams.TaskTemplate.ContainerSpec.Args = ['-c', 'sleep 36000'];
		}

		soajs.log.debug('Deployer params: ' + JSON.stringify (haServiceParams));
		lib.getDeployer(soajs, deployerConfig, model, function (error, deployer) {
			checkError(error, cb, function () {
				deployer.createService(haServiceParams, cb);
			});
		});
	},

	"scaleHAService": function (soajs, deployerConfig, options, model, cb) {
		lib.getDeployer(soajs, deployerConfig, model, function (error, deployer) {
			checkError(error, cb, function () {
				var service = deployer.getService(options.serviceName);
				service.inspect(function (error, serviceInfo) {
					checkError(error, cb, function () {
						//docker api does not support updating a service using its name
						service = deployer.getService(serviceInfo.ID);

						var update = serviceInfo.Spec;
						update.version = serviceInfo.Version.Index;
						update.Mode.Replicated.Replicas = options.scale;
						service.update(update, cb);
					});
				});
			});
		});
	},

	"inspectHAService": function (soajs, deployerConfig, options, model, cb) {
		lib.getDeployer(soajs, deployerConfig, model, function (error, deployer) {
			checkError(error, cb, function () {
				var output = {}, params = {};
				var service = deployer.getService(options.serviceName);
				service.inspect(function (error, serviceInfo) {
					checkError(error, cb, function () {
						output.service = serviceInfo;

						params.filters = {service: [options.serviceName]};
						deployer.listTasks(params, function (error, serviceTasks) {
							checkError(error, cb, function () {
								output.tasks = serviceTasks;
								return cb(null, output);
							});
						});
					});
				});
			});
		});
	},


	"getServiceComponents": function (soajs, deployerConfig, options, model, cb) {
		deployer.inspectHAService(soajs, deployerConfig, options, model, function (error, serviceInfo) {
			checkError(error, cb, function () {
				var runningTasks = [];
				serviceInfo.tasks.forEach(function (oneTask) {
					if (oneTask.Status.State === 'running') {
						runningTasks.push(oneTask);
					}
				});

				if (runningTasks.length !== options.serviceCount) {
					setTimeout(function () {
						return deployer.getServiceComponents(soajs, deployerConfig, options, model, cb);
					}, 500);
				}
				else {
					serviceInfo.tasks = runningTasks;
					return cb(null, serviceInfo);
				}
			});
		});
	},

	"inspectHATask": function (soajs, deployerConfig, options, model, cb) {
		lib.getDeployer(soajs, deployerConfig, model, function (error, deployer) {
			checkError(error, cb, function () {
				var serviceName = options.taskName.split('.')[0];
				var taskNumber = options.taskName.split('.')[1];
				var params = {
					filters: {
						service: [serviceName]
					}
				};

				deployer.listTasks(params, function (error, taskRecords) {
					checkError(error || taskRecords.length === 0, cb, function () {
						var found;
						for (var i = 0; i < taskRecords.length; i++) {
							if (taskRecords[i].Slot == taskNumber) {
								found = taskRecords[i];
								break;
							}
						}

						return ((found) ? cb(null, found) : cb());
					});
				});
			});
		});
	},

	"deleteHAService": function (soajs, deployerConfig, options, model, cb) {
		lib.getDeployer(soajs, deployerConfig, model, function (error, deployer) {
			checkError(error, cb, function () {
				var serviceId = options.serviceName;
				var service = deployer.getService(serviceId);
				service.remove(cb);
			});
		});
	},

	"inspectContainer": function (soajs, deployerConfig, options, model, cb) {
		var opts = {
			collection: dockerColl,
			conditions: { recordType: 'node', id: options.nodeId }
		};
		model.findEntry(soajs, opts, function (error, nodeInfo) {
			checkError(error || !nodeInfo, cb, function () {
				deployerConfig.host = nodeInfo.ip;
				deployerConfig.port = nodeInfo.dockerPort;
				deployerConfig.flags = {targetNode: true};
				lib.getDeployer(soajs, deployerConfig, model, function (error, deployer) {
					checkError(error, cb, function () {
						var container = deployer.getContainer(options.containerId);
						container.inspect(cb);
					});
				});
			});
		});
	},

	"getContainerLogs": function (soajs, deployerConfig, options, model, res) {
		deployer.inspectHATask(soajs, deployerConfig, {taskName: options.taskName}, model, function (error, taskInfo) {
			if (error) {
				soajs.log.error(error);
				return res.jsonp(soajs.buildResponse({code: 811, msg: error.message}));
			}

			var containerId = taskInfo.Status.ContainerStatus.ContainerID;
			var opts = {
				collection: dockerColl,
				conditions: { recordType: 'node', id: taskInfo.NodeID }
			};
			model.findEntry(soajs, opts, function (error, nodeInfo) {
				if (error || !nodeInfo) {
					error = ((error) ? error : {message: 'Node record not found'});
					soajs.log.error(error);
					return res.jsonp(soajs.buildResponse({code: 601, msg: error.message}));
				}

				deployerConfig.host = nodeInfo.ip;
				deployerConfig.port = nodeInfo.dockerPort;
				deployerConfig.flags = {targetNode: true};
				lib.getDeployer(soajs, deployerConfig, model, function (error, deployer) {
					if (error) {
						soajs.log.error(error);
						return res.jsonp(soajs.buildResponse({code: 601, msg: error.message}));
					}
					var container = deployer.getContainer(containerId);
					var logOptions = {
						stdout: true,
						stderr: true,
						tail: 400
					};

					container.logs(logOptions, function (error, logStream) {
						if (error) {
							soajs.log.error(error);
							return res.jsonp(soajs.buildResponse({code: 601, msg: error.message}));
						}

						var data = '';
						var chunk;
						logStream.setEncoding('utf8');
						logStream.on('readable', function () {
							var handle = this;
							while ((chunk = handle.read()) !== null) {
								data += chunk.toString("utf8");
							}
						});

						logStream.on('end', function () {
							logStream.destroy();
							var out = soajs.buildResponse(null, {'data': data});
							return res.json(out);
						});
					});
				});
			});
		});
	},

	"buildContainerRecords": function (soajs, deployerConfig, options, model, cb) {
		async.map(options.serviceInfo.tasks, function (oneInstance, callback) {
			var info = {
				nodeId: oneInstance.NodeID,
				containerId: oneInstance.Status.ContainerStatus.ContainerID
			};
			//TODO: inspect container might no longer be needed
			deployer.inspectContainer(soajs, deployerConfig, info, model, function (error, containerInfo) {
				if (error) {
					return callback(error);
				}

				var newRecord = {
					type: options.serviceType,
					env: soajs.inputmaskData.envCode.toLowerCase(),
					running: true,
					recordType: 'container',
					deployer: deployerConfig,
					taskName: containerInfo.Config.Labels['com.docker.swarm.task.name'],
					serviceName: containerInfo.Config.Labels['com.docker.swarm.service.name']
				};

				//cleaning dots from field names to avoid mongo error
				var labels = Object.keys(containerInfo.Config.Labels);
				labels.forEach(function (oneLabel) {
					containerInfo.Config.Labels[oneLabel.replace(/\./g, '-')] = containerInfo.Config.Labels[oneLabel];
					delete containerInfo.Config.Labels[oneLabel];
				});
				newRecord.info = containerInfo;

				return callback(null, newRecord);
			});
		}, cb);
	},

	"getNewInstances": function (soajs, deployerConfig, options, model, cb) {
		var newInstances = [];
		async.each(options.serviceInfo.tasks, function (oneTask, callback) {
			var found = false;
			var taskName = options.serviceInfo.service.Spec.Name + '.' + oneTask.Slot;
			for (var i = 0; i < options.dockerRecords.length; i++) {
				if (options.dockerRecords[i].taskName === taskName) {
					found = true;
					break;
				}
			}

			if (!found) {
				newInstances.push(oneTask);
			}

			return callback(null, true);
		}, function (error, result) {
			return cb(newInstances);
		});
	},

	"getRemovedInstances": function (soajs, deployerConfig, options, model, cb) {
		var rmInstances = [];
		async.each(options.dockerRecords, function (oneRecord, callback) {
			var found = false;
			for (var i = 0; i < options.serviceInfo.tasks.length; i++) {
				var taskName = options.serviceInfo.service.Spec.Name + '.' + options.serviceInfo.tasks[i].Slot;
				if (taskName === oneRecord.taskName) {
					found = true;
					break;
				}
			}

			if (!found) {
				rmInstances.push(oneRecord);
			}

			return callback(null, true);
		}, function (error, result) {
			return cb(rmInstances);
		});
	}
};

module.exports = deployer;
