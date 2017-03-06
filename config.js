'use strict';
var serviceConfig = require("./schemas/serviceConfig");
var cbSchema = require("./schemas/cb");
var aclSchema = require("./schemas/acl");

module.exports = {
	type: 'service',
	prerequisites: {
		cpu: '',
		memory: ''
	},
	"serviceVersion": 1,
	"serviceName": "dashboard",
	"serviceGroup": "SOAJS Core Services",
	"servicePort": 4003,
	"requestTimeout": 60,
	"requestTimeoutRenewal": 5,
	"extKeyRequired": true,
	"awareness": true,
	"awarenessEnv": true,
	"oauth": false,
	"session": true,
	"roaming": true,

	"hasher": {
		"hashIterations": 1024,
		"seedLength": 32
	},

	"expDateTTL": 86400000,
	"ncpLimit": 16,

	"profileLocation": process.env.SOAJS_PROFILE_LOC || "/opt/soajs/FILES/profiles/",

	"images": {
		"nginx": 'nginx',
		"services": "soajs"
	},

	"network": 'soajsnet',

	"imagesDir": "/opt/soajs/FILES/deployer/",

	"kubeNginx": {
		"minPort": 0,
		"maxPort": 2767
	},

	"certificates": {
		types: ['ca', 'cert', 'key']
	},

	"gitAccounts": {
		"bitbucket_org": {
			apiDomain: 'https://api.bitbucket.org/1.0',
			routes: {
				getUserRecord: '/users/%USERNAME%',
				getAllRepos: '/user/repositories',
				getContent: '/repositories/%USERNAME%/%REPO_NAME%/raw/%BRANCH%/%FILE_PATH%',
				getBranches: '/repositories/%USERNAME%/%REPO_NAME%/branches'
			},
			oauth: {
				domain: 'https://bitbucket.org/site/oauth2/access_token'
			},
			repoConfigsFolder: __dirname + '/repoConfigs',
			defaultConfigFilePath: "config.js"
		},
		"bitbucket_enterprise": {
			userAgent: "SOAJS Bitbucket App",
			defaultConfigFilePath: "config.js",
			repoConfigsFolder: __dirname + '/repoConfigs',
			// required for OAuth
			apiDomain: '%PROVIDER_DOMAIN%/rest/api/1.0',
			downloadUrl: '%PROVIDER_DOMAIN%/projects/%PROJECT_NAME%/repos/%REPO_NAME%/browse/%PATH%?at=%BRANCH%&raw'
		},
		"github": {
			"protocol": "https",
			"domainName": "api.github.com",
			"apiDomain": "https://api.github.com",
			"apiVersion": "3.0.0",
			"timeout": 30000,
			"userAgent": "SOAJS GitHub App",
			"urls": {
				"getReposAuthUser": "https://api.github.com/user/repos",
				"getReposNonAuthUser": "https://api.github.com/users/%OWNER%/repos",
				"getReposPublicOrg": "https://api.github.com/orgs/%OWNER%/repos"
			},
			"tokenScope": ["repo", "admin:repo_hook"],
			"defaultConfigFilePath": "config.js",
			"repoConfigsFolder": __dirname + '/repoConfigs'
		}
	},

	"errors": require("./utils/errors"),

	"schema": {
		"commonFields": {
			"description": {
				"source": ['body.description'],
				"required": false,
				"validation": {
					"type": "string"
				}
			},
			"id": {
				"source": ['query.id'],
				"required": true,
				"validation": {
					"type": "string"
				}
			},
			"name": {
				"source": ['body.name'],
				"required": true,
				"validation": {
					"type": "string"
				}
			},
			"_TTL": {
				"source": ['body._TTL'],
				"required": true,
				"validation": {
					"type": "string",
					"enum": ['6', '12', '24', '48', '72', '96', '120', '144', '168']
				}
			},
			'appId': {
				"source": ['query.appId'],
				"required": true,
				"validation": {
					"type": "string"
				}
			},
			'key': {
				"source": ['query.key'],
				"required": true,
				"validation": {
					"type": "string"
				}
			},
			'acl': aclSchema,
			"cluster": {
				"required": true,
				"source": ['body.cluster'],
				"validation": {
					"type": "object",
					"properties": {
						"clusterType": {"type": "string"},
						"URLParam": {"type": "object", "properties": {}},
						"servers": {"type": "array", "items": {"type": "object", "required": true}},
						"extraParam": {"type": "object", "properties": {}},
						"streaming": {"type": "object", "properties": {}},
						"credentials": {
							"type": "object",
							"properties": {
								"username": {"type": "string"},
								"password": {"type": "string"}
							}
						}
					}
				}
			},
			"services": {
				"source": ['body.services'],
				"required": true,
				"validation": {
					"type": "object",
					"properties": {
						"controller": {
							"required": true,
							"type": "object",
							"properties": {
								"maxPoolSize": {"type": "integer", "required": true},
								"authorization": {"type": "boolean", "required": true},
								"requestTimeout": {"type": "integer", "required": true, "min": 20, "max": 60},
								"requestTimeoutRenewal": {"type": "integer", "required": true, "min": 0}
							}
						},
						"config": serviceConfig
					}
				}
			},
			"secret": {
				"source": ['body.secret'],
				"required": true,
				"validation": {
					"type": "string"
				}
			},
			"redirectURI": {
				"source": ['body.redirectURI'],
				"required": false,
				"validation": {
					"type": "string",
					"format": "uri"
				}
			},
			"uId": {
				"source": ['query.uId'],
				"required": true,
				"validation": {
					"type": "string"
				}
			},
			"userId": {
				"source": ['body.userId'],
				"required": true,
				"validation": {
					"type": "string"
				}
			},
			"password": {
				"source": ['body.password'],
				"required": true,
				"validation": {
					"type": "string"
				}
			},
			"productCode": {
				"source": ['body.productCode'],
				"required": true,
				"validation": {
					"type": "string",
					"format": "alphanumeric"
				}
			},
			"packageCode": {
				"source": ['body.packageCode'],
				"required": true,
				"validation": {
					"type": "string",
					"format": "alphanumeric"
				}
			},
			"clearAcl": {
				"source": ['body.clearAcl'],
				"required": false,
				"validation": {
					"type": "boolean"
				}
			},
			"extKey": {
				"source": ['body.extKey'],
				"required": true,
				"validation": {
					"type": "string"
				}
			},
			'expDate': {
				"source": ['body.expDate'],
				"required": false,
				"validation": {
					"type": "string",
					"format": "date-time"
				}
			},
			'device': {
				"source": ['body.device'],
				"required": false,
				"validation": {
					"type": "object"
				}
			},
			'geo': {
				"source": ['body.geo'],
				"required": false,
				"validation": {
					"type": "object"
				}
			},
			'envCode': {
				'source': ['body.envCode'],
				'required': true,
				'validation': {
					'type': 'string'
				}
			},
			'config': {
				"source": ['body.config'],
				"required": true,
				"validation": {
					"type": "object"
				}
			},
			"deployer": {
				"required": true,
				"source": ['body.deployer'],
				"validation": {
					"type": "object",
					"properties": {
						"type": {"required": true, "type": "string", "enum": ['manual', 'container']},
						"selected": {"type": "string", "required": false},
						"docker": {
							"type": "object",
							"required": false,
							"properties": {
								"selected": {"type": "string", "required": false},
								"boot2docker": {
									"type": "object",
									"required": false
								},
								"joyent": {
									"type": "object",
									"required": false
								},
								"socket": {
									"type": "object",
									"required": false
								},
								"rackspace": {
									"type": "object",
									"required": false
								}
							}
						}
					}
				}
			},

			"extKeyRequired": {
				"source": ['body.extKeyRequired'],
				"required": true,
				"validation": {"type": "boolean"}
			},
			"requestTimeout": {
				"source": ['body.requestTimeout'],
				"required": true,
				"validation": {"type": "integer", "min": 0}
			},
			"requestTimeoutRenewal": {
				"source": ['body.requestTimeoutRenewal'],
				"required": true,
				"validation": {"type": "integer", "min": 0}
			},
			'apis': {
				"required": true,
				"source": ['body.apis'],
				"validation": {
					"type": "array",
					"minItems": 1,
					"items": {
						"type": "object",
						"required": true,
						"properties": {
							"l": {"type": "string", "required": true},
							"v": {"type": "string", "required": true},
							"group": {"type": "string", "required": true},
							"groupMain": {"type": "boolean", "required": false}
						}
					}
				}
			},
			"awareness": {
				"required": true,
				"source": ["body.awareness"],
				"validation": {
					"type": "boolean"
				}
			},

			'jobs': {
				'source': ['body.jobs'],
				'required': true,
				'validation': {
					'type': 'object'
				}
			},
			'groupName': {
				'source': ['body.groupName'],
				'required': true,
				'validation': {
					'type': 'string'
				}
			},
			'daemon': {
				'source': ['body.daemon'],
				'required': true,
				'validation': {
					'type': 'string'
				}
			},
			'interval': {
				'source': ['body.interval'],
				'required': false,
				'validation': {
					'type': 'number'
				}
			},
			'cronTime': {
				'source': ['body.cronTime'],
				'required': false,
				'validation': {
					'type': 'text'
				}
			},
			'timeZone': {
				'source': ['body.timeZone'],
				'required': false,
				'validation': {
					'type': 'text'
				}
			},
			'cronTimeDate': {
				'source': ['body.cronTimeDate'],
				'required': false,
				'validation': {
					'type': 'text'
				}
			},

			'status': {
				'source': ['body.status'],
				'required': true,
				'validation': {
					'type': 'number',
					enum: [0, 1]
				}
			},
			'processing': {
				'source': ['body.processing'],
				'required': true,
				'validation': {
					'type': 'string',
					'enum': ['parallel', 'sequential']
				}
			},
			'order': {
				'source': ['body.order'],
				'required': true,
				'validation': {
					'type': 'array'
				}
			},
			'jobName': {
				'source': ['query.jobName'],
				'required': true,
				'validation': {
					'type': 'string'
				}
			},
			'solo': {
				'source': ['body.solo'],
				'required': true,
				'validation': {
					'type': 'boolean'
				}
			},
			'type': {
				'source': ['body.type'],
				'required': true,
				'validation': {
					'type': 'string'
				}
			},
			'owner': {
				'source': ['body.owner'],
				'required': true,
				'validation': {
					'type': 'string'
				}
			},
			'repo': {
				'source': ['body.repo'],
				'required': true,
				'validation': {
					'type': 'string'
				}
			},
			'branch': {
				'source': ['body.branch'],
				'required': true,
				'validation': {
					'type': 'string'
				}
			},
			'main': {
				'source': ['body.main'],
				'required': true,
				'validation': {
					'type': 'string'
				}
			},
			'token': {
				'source': ['body.token'],
				'required': false,
				'validation': {
					'type': 'string'
				}
			}
		},

		"get": {
			"/environment/list": {
				_apiInfo: {
					"l": "List Environments",
					"group": "Environment",
					"groupMain": true
				},
				"short": {
					"required": false,
					"source": ["query.short", "body.short"],
					"validation": {
						"type": "boolean"
					}
				}
			},

			"/environment/dbs/list": {
				_apiInfo: {
					"l": "List Environment Databases",
					"group": "Environment Databases"
				},
				"env": {"source": ['query.env'], "required": true, "validation": {"type": "string", "required": true}}
			},

			"/environment/clusters/list": {
				_apiInfo: {
					"l": "List Environment Database Clusters",
					"group": "Environment Clusters"
				},
				"env": {"source": ['query.env'], "required": true, "validation": {"type": "string", "required": true}}
			},

			"/environment/platforms/list": {
				_apiInfo: {
					"l": "List Environment Platforms",
					"group": "Environment Platforms"
				},
				"env": {
					"source": ['query.env'],
					"required": true,
					"validation": {
						"type": "string",
						"required": true
					}
				}
			},

			"/product/list": {
				_apiInfo: {
					"l": "List Products",
					"group": "Product",
					"groupMain": true
				}
			},

			"/product/get": {
				_apiInfo: {
					"l": "Get Product",
					"group": "Product"
				},
				"commonFields": ['id']
			},

			"/product/packages/list": {
				_apiInfo: {
					"l": "List Product Packages",
					"group": "Product"
				},
				"commonFields": ['id']
			},

			"/product/packages/get": {
				_apiInfo: {
					"l": "Get Product Package",
					"group": "Product"
				},
				"packageCode": {
					"source": ["query.packageCode"],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"productCode": {
					"source": ["query.productCode"],
					"required": true,
					"validation": {
						"type": "string",
						"format": "alphanumeric",
						"maxLength": 6
					}
				}
			},

			"/permissions/get": {
				_apiInfo: {
					"l": "Get Tenant Security Permissions",
					"group": "Tenant"
				},
				"envCode": {
					"source": ["query.envCode"],
					"required": false,
					"validation": {
						"type": "string",
						"format": "alphanumeric"
					}
				}
			},

			"/key/get": {
				_apiInfo: {
					"l": "Get the user dashboard key",
					"group": "Tenant"
				}
			},

			"/tenant/list": {
				_apiInfo: {
					"l": "List Tenants",
					"group": "Tenant"
				},
				"type": {
					"source": ['query.type'],
					"required": false,
					"validation": {
						"type": "string",
						"enum": ["admin", "product", "client"]
					}
				},
				"negate": {
					"source": ['query.negate'],
					"required": false,
					"default": false,
					"validation": {
						"type": "boolean"
					}
				}
			},

			"/tenant/get": {
				_apiInfo: {
					"l": "Get Tenant",
					"group": "Tenant"
				},
				"commonFields": ['id']
			},

			"/tenant/oauth/list": {
				_apiInfo: {
					"l": "Get Tenant oAuth Configuration",
					"group": "Tenant oAuth"
				},
				"commonFields": ['id']
			},

			"/tenant/oauth/users/list": {
				_apiInfo: {
					"l": "List Tenant oAuth Users",
					"group": "Tenant oAuth"
				},
				"commonFields": ['id']
			},

			"/tenant/application/list": {
				_apiInfo: {
					"l": "List Tenant Applications",
					"group": "Tenant Application"
				},
				"commonFields": ['id']
			},

			"/tenant/application/key/list": {
				_apiInfo: {
					"l": "List Tenant Application Keys",
					"group": "Tenant Application"
				},
				"commonFields": ['id', 'appId']
			},

			"/tenant/application/key/ext/list": {
				_apiInfo: {
					"l": "List Tenant Application External Keys",
					"group": "Tenant Application"
				},
				"commonFields": ['id', 'appId', 'key']
			},

			"/tenant/application/key/config/list": {
				_apiInfo: {
					"l": "List Tenant Application Key Configuration",
					"group": "Tenant Application"
				},
				"commonFields": ['id', 'appId', 'key']
			},

			"/tenant/db/keys/list": {
				_apiInfo: {
					"l": "List Dashboard Tenant Keys",
					"group": "Dashboard Tenants",
					"groupMain": true
				}
			},

			"/settings/tenant/get": {
				_apiInfo: {
					"l": "Get Tenant",
					"group": "Tenant Settings"
				}
			},

			"/settings/tenant/oauth/list": {
				_apiInfo: {
					"l": "Get Tenant oAuth Configuration",
					"group": "Tenant Settings"
				}
			},

			"/settings/tenant/oauth/users/list": {
				_apiInfo: {
					"l": "List Tenant oAuth Users",
					"group": "Tenant Settings"
				}
			},

			"/settings/tenant/application/list": {
				_apiInfo: {
					"l": "List Tenant Applications",
					"group": "Tenant Settings"
				}
			},

			"/settings/tenant/application/key/list": {
				_apiInfo: {
					"l": "List Tenant Application Keys",
					"group": "Tenant Settings"
				},
				"commonFields": ['appId']
			},

			"/settings/tenant/application/key/ext/list": {
				_apiInfo: {
					"l": "List Tenant Application External Keys",
					"group": "Tenant Settings"
				},
				"commonFields": ['appId', 'key']
			},

			"/settings/tenant/application/key/config/list": {
				_apiInfo: {
					"l": "List Tenant Application Key Configuration",
					"group": "Tenant Settings"
				},
				"commonFields": ['appId', 'key']
			},
			/*
			 * This API will return the env where a service is deployed.
			 * it takes the service name and renders an object having the following form :
			 * "env name : apiPrefix.domain"
			 */
			"/services/env/list": {
				_apiInfo: {
					"l": "List The Environment Where A Service Is Deployed",
					"group": "Services"
				},
				'service': {
					'source': ['query.service'],
					'required': true,
					"validation": {
						"type": "string"
					}
				},
				'version': {
					'source': ['query.version'],
					'required': false,
					"validation": {
						"type": "integer"
					}
				}
			},

			"/daemons/groupConfig/list": {
				_apiInfo: {
					"l": "List Daemon Group Configuration",
					"group": "Daemons"
				},
				'grpConfNames': {
					'source': ['body.grpConfNames'],
					'required': false,
					'validation': {
						'type': 'array',
						'items': {'type': 'string'}
					}
				}
			},

			"/daemons/groupConfig/serviceConfig/list": {
				_apiInfo: {
					"l": "List Service Configuration",
					"group": "Daemons"
				},
				'commonFields': ['id', 'jobName']
			},

			"/daemons/groupConfig/tenantExtKeys/list": {
				_apiInfo: {
					"l": "List Job's External Keys",
					"group": "Daemons"
				},
				'commonFields': ['id', 'jobName']
			},

			"/staticContent/list": {
				_apiInfo: {
					"l": "List Static Content",
					"group": "Static Content"
				},
				'staticContentNames': {
					'source': ['body.staticContentNames'],
					'required': false,
					'validation': {
						'type': 'array',
						'items': {'type': 'string'}
					}
				}
			},

			"/hosts/list": {
				_apiInfo: {
					"l": "List Hosts",
					"group": "Hosts",
					"groupMain": true
				},
				'env': {
					'source': ['query.env'],
					'required': true,
					"validation": {
						"type": "string",
						"required": true
					}
				}
			},

			"/cloud/services/list": {
				"_apiInfo": {
					"l": "List Cloud Services",
					"group": "HA Cloud"
				},
				"env": {
					"source": ["query.env"],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},

			"/cloud/nodes/list": {
				"_apiInfo": {
					"l": "List HA Cloud Nodes",
					"group": "HA Cloud"
				}
			},

			"/cloud/services/instances/logs": {
				"_apiInfo": {
					"l": "Get Service Container Logs",
					"group": "HA Cloud"
				},
				"env": {
					"source": ['query.env'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"serviceId": {
					"source": ['query.serviceId'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"taskId": {
					"source": ['query.taskId'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},

			"/cloud/namespaces/list": {
				"_apiInfo": {
					"l": "List Available Namespaces",
					"group": "HA Cloud"
				}
			},

			"/gitAccounts/accounts/list": {
				"_apiInfo": {
					"l": "List Git Accounts",
					"group": "Git Accounts"
				}
			},

			"/gitAccounts/getRepos": {
				"_apiInfo": {
					"l": "Get Repositories",
					"group": "Git Accounts"
				},
				"id": {
					"source": ['query.id'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"provider": {
					"source": ['query.provider'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"page": {
					"source": ['query.page'],
					"required": true,
					"validation": {
						"type": "number",
						"minimum": 1
					}
				},
				"per_page": {
					"source": ['query.per_page'],
					"required": true,
					"validation": {
						"type": "number",
						"minimum": 1
					}
				}
			},

			"/gitAccounts/getBranches": {
				"_apiInfo": {
					"l": "Get Repository Branches",
					"group": "Git Accounts"
				},
				"name": {
					"source": ['query.name'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"type": {
					"source": ['query.type'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"id": {
					"source": ['query.id'],
					"required": false,
					"validation": {
						"type": "string"
					}
				},
				"provider": {
					"source": ['query.provider'],
					"required": false,
					"validation": {
						"type": "string"
					}
				}
			},

			"/cb/list": {
				"_apiInfo": {
					"l": "List Content Schema",
					"group": "Content Builder",
					"groupMain": true
				},
				'port': {
					'required': false,
					'source': ['query.port'],
					'validation': {
						'type': 'boolean'
					}
				}
			},

			"/cb/get": {
				"_apiInfo": {
					"l": "Get One Content Schema",
					"group": "Content Builder"
				},
				"commonFields": ["id"],
				"version": {
					"required": false,
					"source": ["query.version"],
					"validation": {
						"type": "integer"
					}
				}
			},

			"/cb/listRevisions": {
				"_apiInfo": {
					"l": "List Content Schema Revisions",
					"group": "Content Builder"
				}
			},
			/*
			 * this API will get the content and the url of any file located on a specific
			 * github/bitbucket account for a certain repo.
			 * In our case we need to get the yaml file and its content
			 */
			"/gitAccounts/getYaml": {
				"_apiInfo": {
					"l": "Get Yaml file",
					"group": "Git Accounts"
				},
				"owner": {
					"source": ['query.owner'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"repo": {
					"source": ['query.repo'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"filepath": {
					"source": ['query.filepath'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"serviceName": {
					"source": ['query.serviceName'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"version": {
					"source": ['query.version'],
					"required": false,
					"validation": {
						"type": "integer"
					}
				},
				"env": {
					"source": ['query.env'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"type":{
					"source": ['query.type'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			}
		},

		"post": {
			"/services/list": {
				_apiInfo: {
					"l": "List Services",
					"group": "Services"
				},
				'serviceNames': {
					'source': ['body.serviceNames'],
					'required': false,
					"validation": {
						"type": "array",
						'items': {'type': 'string'}
					}
				}
			},
			"/environment/add": {
				_apiInfo: {
					"l": "Add Environment",
					"group": "Environment"
				},
				"commonFields": ['description', 'services'],
				"code": {
					"source": ['body.code'],
					"required": true,
					"validation": {
						"type": "string",
						"format": "alphanumeric",
						"maxLength": 4
					}
				},
				"domain": {
					"source": ['body.domain'],
					"required": true,
					"validation": {
						"type": "string",
						"format": "hostname"
					}
				},
				"apiPrefix": {
					"source": ['body.apiPrefix'],
					"required": false,
					"default": "api",
					"validation": {
						"type": "string"
					}
				},
				"sitePrefix": {
					"source": ['body.sitePrefix'],
					"required": false,
					"default": "site",
					"validation": {
						"type": "string"
					}
				}
			},

			"/environment/dbs/add": {
				_apiInfo: {
					"l": "Add Environment Database",
					"group": "Environment Databases"
				},
				"env": {"source": ['query.env'], "required": true, "validation": {"type": "string", "required": true}},
				"name": {"source": ['body.name'], "required": true, "validation": {"type": "string", "required": true}},
				"cluster": {
					"source": ['body.cluster'],
					"required": true,
					"validation": {"type": "string", "required": true}
				},
				"tenantSpecific": {
					"source": ['body.tenantSpecific'],
					"required": false,
					"validation": {"type": "boolean", "required": true}
				},
				"sessionInfo": {
					"source": ['body.sessionInfo'],
					"required": false,
					"validation": {
						"type": "object",
						"required": true,
						"properties": {
							"store": {"type": "object", "required": true},
							"dbName": {"type": "string", "required": true},
							"expireAfter": {"type": "integer", "required": true},
							"collection": {"type": "string", "required": true},
							"stringify": {"type": "boolean", "required": true}
						}
					}
				}
			},

			"/environment/clusters/add": {
				_apiInfo: {
					"l": "Add Environment Database Cluster",
					"group": "Environment Clusters"
				},
				"commonFields": ['cluster'],
				"env": {"source": ['query.env'], "required": true, "validation": {"type": "string", "required": true}},
				"name": {"source": ['query.name'], "required": true, "validation": {"type": "string", "required": true}}
			},

			"/environment/platforms/cert/upload": {
				_apiInfo: {
					"l": "Upload Certificate",
					"group": "Environment Platforms"
				}
			},

			"/product/add": {
				_apiInfo: {
					"l": "Add Product",
					"group": "Product"
				},
				"commonFields": ['description', 'name'],
				"code": {
					"source": ['body.code'],
					"required": true,
					"validation": {
						"type": "string",
						"format": "alphanumeric",
						"maxLength": 6
					}
				}
			},

			"/product/packages/add": {
				_apiInfo: {
					"l": "Add Product Package",
					"group": "Product"
				},
				"commonFields": ['id', 'name', 'description', '_TTL', 'acl'],
				"code": {
					"source": ["body.code"],
					"required": true,
					"validation": {
						"type": "string",
						"format": "alphanumeric",
						"minLength": 4,
						"maxLength": 6
					}
				}
			},

			"/tenant/add": {
				_apiInfo: {
					"l": "Add Tenant",
					"group": "Tenant"
				},
				"commonFields": ['name', 'description'],
				"code": {
					"source": ['body.code'],
					"required": true,
					"validation": {
						"type": "string",
						"format": "alphanumeric",
						"maxLength": 4
					}
				},
				"email": {
					"source": ['body.email'],
					"required": true,
					"validation": {
						"type": "email"
					}
				},
				"type": {
					"source": ['body.type'],
					"required": false,
					"default": "client",
					"validation": {
						"type": "string",
						"enum": ["admin", "product", "client"]
					}
				},
				"tag": {
					"source": ['body.tag'],
					"required": false,
					"validation": {
						"type": "string"
					}
				}
			},

			"/tenant/oauth/add": {
				_apiInfo: {
					"l": "Add Tenant oAuth Configuration",
					"group": "Tenant oAuth"
				},
				"commonFields": ['id', 'secret', 'redirectURI']
			},

			"/tenant/oauth/users/add": {
				_apiInfo: {
					"l": "Add Tenant oAuth User",
					"group": "Tenant oAuth"
				},
				"commonFields": ['id', 'userId', 'password']
			},

			"/tenant/application/add": {
				_apiInfo: {
					"l": "Add Tenant Application",
					"group": "Tenant Application"
				},
				"commonFields": ['id', '_TTL', 'description', 'acl', 'productCode', 'packageCode']
			},

			"/tenant/application/key/add": {
				_apiInfo: {
					"l": "Add Tenant Application Key",
					"group": "Tenant Application"
				},
				"commonFields": ['id', 'appId']
			},

			"/tenant/application/key/ext/add": {
				_apiInfo: {
					"l": "Add Tenant Application External Key",
					"group": "Tenant Application"
				},
				"commonFields": ['id', 'appId', 'key', 'expDate', 'device', 'geo'],
				"env": {
					"source": ['body.env'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},

			"/tenant/application/key/ext/delete": { //TODO: should be delete, remove params passed in body and change its method
				_apiInfo: {
					"l": "Delete Tenant Application External Key",
					"group": "Tenant Application"
				},
				"commonFields": ['id', 'appId', 'key', 'extKey'],
				"extKeyEnv": {
					"source": ['body.extKeyEnv'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},

			"/tenant/acl/get": { //TODO: should be changed from post to get
				_apiInfo: {
					"l": "Get Current Tenant Access Level",
					"group": "Tenant"
				},
				"commonFields": ['id']
			},

			"/settings/tenant/oauth/add": {
				_apiInfo: {
					"l": "Add Tenant oAuth Configuration",
					"group": "Tenant Settings"
				},
				"commonFields": ['secret', 'redirectURI']
			},

			"/settings/tenant/oauth/users/add": {
				_apiInfo: {
					"l": "Add Tenant oAuth User",
					"group": "Tenant Settings"
				},
				"commonFields": ['userId', 'password']
			},

			"/settings/tenant/application/key/add": {
				_apiInfo: {
					"l": "Add Tenant Application Key",
					"group": "Tenant Settings"
				},
				"commonFields": ['appId']
			},

			"/settings/tenant/application/key/ext/add": {
				_apiInfo: {
					"l": "Add Tenant Application External Key",
					"group": "Tenant Settings"
				},
				"commonFields": ['appId', 'key', 'expDate', 'device', 'geo'],
				"env": {
					"source": ['body.env'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},

			"/settings/tenant/application/key/ext/delete": { //TODO: should be delete, remove params passed in body and change its method
				_apiInfo: {
					"l": "Delete Tenant Application External Key",
					"group": "Tenant Settings"
				},
				"commonFields": ['appId', 'key', 'extKey'],
				"extKeyEnv": {
					"source": ['body.extKeyEnv'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},

			"/daemons/groupConfig/add": {
				_apiInfo: {
					"l": "Add Daemon Group Configuration",
					"group": "Daemons"
				},
				'commonFields': ['groupName', 'daemon', 'cronTime', 'cronTimeDate', 'timeZone', 'interval', 'status', 'processing', 'jobs', 'order', 'solo'],
				'type':{
					"required": true,
					"source": ["body.type"],
					"validation":{
						"type": "string",
						"enum": ["interval", "cron", "once"]
					}
				}
			},

			"/daemons/list": {
				_apiInfo: {
					"l": "List Daemons",
					"group": "Daemons"
				},
				'daemonNames': {
					'source': ['body.daemonNames'],
					'required': false,
					'validation': {
						'type': 'array',
						'items': {'type': 'string'}
					}
				},
				'getGroupConfigs': {
					'source': ['query.getGroupConfigs'],
					'required': false,
					'validation': {
						'type': 'boolean'
					}
				}
			},

			"/cloud/services/soajs/deploy": {
				"_apiInfo": {
					"l": "Deploy A New SOAJS Service",
					"group": "HA Cloud"
				},
				"env": {
					"source": ['body.env'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"type": {
					"required": true,
					"source": ['body.type'],
					"validation": {
						"type": "string",
						"enum": ['service', 'daemon', 'nginx']
					}
				},
				"name": {
					"required": true,
					"source": ['body.name'],
					"validation": {
						"type": "string"
					}
				},
				"version": {
					"source": ['body.version'],
					"required": false,
					"default": 1,
					"validation": {
						"type": "number",
						"minimum": 1
					}
				},
				"variables": {
					"required": false,
					"source": ['body.variables'],
					"validation": {
						"type": "array",
						"minItems": 1,
						"items": {"type": "string"}
					}
				},
				"gitSource": {
					"required": false,
					"source": ['body.gitSource'],
					"validation": {
						"type": "object",
						"required": true,
						"properties": {
							"owner": { "required": true, "type": "string" },
							"repo": { "required": true, "type": "string" },
							"branch": { "required": true, "type": "string" },
							"commit": { "required": true, "type": "string" }
						}
					}
				},
				"deployConfig": {
					"required": true,
					"source": ['body.deployConfig'],
					"validation": {
						"type": "object",
						"required": true,
						"properties": {
							"useLocalSOAJS": { "required": false, "type": "boolean" },
							"memoryLimit": { "required": false, "type": "number", "default": 209715200 },
							"imagePrefix": { "required": true, "type": "string", "default": "soajsorg" },
							"ports": {
								"required": false,
								"type": "array",
								"items": {
									"type": "object",
									"properties": {
										"isPublished": { "required": false, "type": "boolean", "default": false },
										"target": { "required": false, "type": "number" },
										"published": { "required": false, "type": "number" }
									}
								}
							},
							"isKubernetes": { "required": false, "type": "boolean" }, //NOTE: only required in case of controller deployment
							"replication": {
								"required": true,
								"type": "object",
								"properties": {
									"mode": { "required": true, "type": "string", "enum": ['replicated', 'global', 'deployment', 'daemonset'] },
									"replicas": { "required": false, "type": "number" }
								}
							},
							"readinessProbe": { //NOTE: only applicable in kubernetes mode
								"required": false,
								"type": "object",
								"properties": {
									"initialDelaySeconds": { "required": true, "type": "number", "minimum": 1 },
				                    "timeoutSeconds": { "required": true, "type": "number", "minimum": 1 },
				                    "periodSeconds": { "required": true, "type": "number", "minimum": 1 },
				                    "successThreshold": { "required": true, "type": "number", "minimum": 1 },
				                    "failureThreshold": { "required": true, "type": "number", "minimum": 1 }
								}
							}
						}
					}
				},
				"contentConfig": {
					"required": false,
					"source": ['body.contentConfig'],
					"validation": {
						"type": "object",
						"properties": {
							"service": {
								"required": false,
								"type": "object",
								"properties": {
									"gc": { "required": true, "type": "boolean" },
									"gcName": { "required": true, "type": "string" },
									"gcVersion": { "required": true, "type": "number" }
								}
							},
							"daemon": {
								"required": false,
								"type": "object",
								"properties": {
									"grpConfName": { "required": true, "type": "string" }
								}
							},
							"nginx": {
								"required": false,
								"type": "object",
								"properties": {
									"ui": {
                                        "type": "object",
                                        "required": false,
                                        "properties": {
                                            "id": { "type": "string", "required": true },
                                            "branch": { "type": "string", "required": true },
                                            "commit": { "type": "string", "required": true }
                                        }
                                    },
									"supportSSL": { "required": false, "type": "boolean" }
								}
							}
						}
					}
				}
			},

			"/cloud/services/custom/deploy": {
				"_apiInfo": {
					"l": "Add A New Custom Service",
					"group": "HA Cloud"
				},
				"env": {
					"source": ['body.env'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"name": {
					"required": true,
					"source": ['body.name'],
					"validation": {
						"type": "string"
					}
				},
				"variables": {
					"required": false,
					"source": ['body.variables'],
					"validation": {
						"type": "array",
						"minItems": 1,
						"items": {"type": "string"}
					}
				},
				"labels": {
					"required": false,
					"source": ['body.labels'],
					"default": {},
					"validation": {
						"type": "object"
					}
				},
				"command": {
					"required": false,
					"source": ['body.command'],
					"validation": {
						"type": "object",
						"properties": {
							"cmd": { "required": false, "type": "array" },
							"args": { "required": false, "type": "array" }
						}
					}
				},
				"deployConfig": {
					"required": true,
					"source": ['body.deployConfig'],
					"validation": {
						"type": "object",
						"required": true,
						"properties": {
							"image": { "required": true, "type": "string" },
							"workDir": { "required": false, "type": "string" },
							"memoryLimit": { "required": false, "type": "number", "default": 209715200 },
							"network": { "required": false, "type": "string" },
							"ports": {
								"required": false,
								"type": "array",
								"items": {
									"type": "object",
									"properties": {
										"isPublished": { "required": false, "type": "boolean", "default": false },
										"target": { "required": true, "type": "number" },
										"published": { "required": false, "type": "number" }
									}
								}
							},
							"replication": {
								"required": true,
								"type": "object",
								"properties": {
									"mode": { "required": true, "type": "string", "enum": ['replicated', 'global'] },
									"replicas": { "required": false, "type": "number" }
								}
							},
							"readinessProbe": { //NOTE: only applicable in kubernetes mode, httpGet readiness probe only supported
								"required": false,
								"type": "object",
								"properties": {
									"path": { "required": true, "type": "string" },
									"port": { "required": true, "type": "string" },
									"initialDelaySeconds": { "required": true, "type": "number", "minimum": 1 },
				                    "timeoutSeconds": { "required": true, "type": "number", "minimum": 1 },
				                    "periodSeconds": { "required": true, "type": "number", "minimum": 1 },
				                    "successThreshold": { "required": true, "type": "number", "minimum": 1 },
				                    "failureThreshold": { "required": true, "type": "number", "minimum": 1 }
								}
							},
							"restartPolicy": {
								"required": true,
								"type": "object",
								"properties": {
									"condition": { "required": true, "type": "string", "enum": ['none', 'on-failure', 'any']},
									"maxAttempts": { "required": true, "type": "number" }
								}
							},
							"volume": {
								"required": false,
								"type": "object",
								"properties": {
									"type": { "required": true, "type": "string", "enum": ['bind', 'volume'] },
									"readOnly": { "required": false, "type": "boolean" },
									"source": { "required": true, "type": "string" },
									"target": { "required": true, "type": "string" }
								}
							}
						}
					}
				},
			},

			"/cloud/nodes/add": {
				"_apiInfo": {
					"l": "Add HA Cloud Node",
					"group": "HA Cloud"
				},
				"env": {
					"source": ['body.env'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"host": {
					"source": ['body.host'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"port": {
					"source": ['body.port'],
					"required": false,
					"validation": {
						"type": "number"
					}
				},
				"role": {
					"source": ['body.role'],
					"required": false,
					"validation": {
						"type": "string",
						"enum": ['manager', 'worker']
					}
				}
			},

			"/cloud/services/maintenance": {
				"_apiInfo": {
					"l": "Perform A Maintenance Operation on a Deployed Service",
					"group": "HA Cloud"
				},
				"env": {
					"source": ['body.env'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"serviceId": {
					"source": ['body.serviceId'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"serviceName": {
					"source": ['body.serviceName'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"type": {
					"source": ['body.type'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"operation": {
					"source": ['body.operation'],
					"required": true,
					"validation": {
						"type": "string",
						"enum": ["heartbeat", "reloadRegistry", "loadProvision", "awarenessStat", 'infoHost', 'daemonStats', 'reloadDaemonConf']
					}
				}
			},

			"/gitAccounts/login": {
				"_apiInfo": {
					"l": "Github Login",
					"group": "Git Accounts"
				},
				"username": {
					"source": ['body.username'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"password": {
					"source": ['body.password'],
					"required": false,
					"validation": {
						"type": "string"
					}
				},
				"label": {
					"source": ['body.label'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"provider": {
					"source": ['body.provider'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"domain": {
					"source": ['body.domain'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"type": {
					"source": ['body.type'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"access": {
					"source": ['body.access'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"oauthKey": {
					"source": ['body.oauthKey'],
					"required": false,
					"validation": {
						"type": "string"
					}
				},
				"oauthSecret": {
					"source": ['body.oauthSecret'],
					"required": false,
					"validation": {
						"type": "string"
					}
				}
			},

			"/gitAccounts/repo/activate": {
				"_apiInfo": {
					"l": "Activate Repository",
					"group": "Git Accounts"
				},
				"id": {
					"source": ['query.id'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"provider": {
					"source": ['body.provider'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"owner": {
					"source": ['body.owner'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"repo": {
					"source": ['body.repo'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"project": {
					"source": ['body.project'],
					"required": false,
					"validation": {
						"type": "string"
					}
				},
				"configBranch": {
					"source": ['body.configBranch'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},

			"/cb/add": {
				"_apiInfo": {
					"l": "Add New Content Schema",
					"group": "Content Builder"
				},
				"commonFields": ["name"],
				"config": {
					"required": true,
					"source": ["body.config"],
					"validation": cbSchema
				}
			},

			"/hosts/maintenanceOperation": {
				"_apiInfo": {
					"l": "Perform Maintenance Operation",
					"group": "Hosts"
				},
				"operation": {
					"required": true,
					"source": ['body.operation'],
					"validation": {
						"type": "string",
						"enum": ["heartbeat", "reloadRegistry", "loadProvision", "awarenessStat", 'infoHost', 'daemonStats']
					}
				},
				"serviceName": {
					"source": ['body.serviceName'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"serviceHost": {
					"source": ['body.serviceHost'],
					"required": false,
					"validation": {
						"type": "string"
					}
				},
				"servicePort": {
					"source": ['body.servicePort'],
					"required": true,
					"validation": {
						"type": "integer",
						"min": 4000
					}
				},
				"env": {
					"source": ['body.env'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"hostname": {
					"source": ['body.hostname'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},

			"/swagger/simulate": {
				"_apiInfo": {
					"l": "Api simulation service",
					"group": "Simulate",
					"groupMain": true
				},
				"data": {
					"required": true,
					"source": ['body.data'],
					"validation": {
						"type": "object",
						"properties": {
							"input": {
								"type": "object",
								"properties": {}
							},
							"imfv": {
								"type": "object",
								"properties": {}
							}
						}
					}
				}

			},

			"/swagger/generate": {
				"_apiInfo": {
					"l": "Generate Service via Swagger",
					"group": "swagger",
					"groupMain": true
				},
				"language": {
					"required": false,
					"source": ["body.language"],
					"default": "soajs",
					"validation": {
						"type": "string",
						"enum": ["soajs", "nodejs", "php", "asp"]
					}
				},
				"data": {
					"required": true,
					"source": ['body.data'],
					"validation": {
						"type": "object",
						"properties": {
							"service": {
								"required": true,
								"type": "object",
								"properties": {
									"serviceName": {
										"type": "string",
										"required": true,
										"pattern": /^[a-z0-9\-]+$/
									},
									"serviceVersion": {
										"type": "number",
										"required": true,
										"min": 1
									},
									"serviceGroup": {
										"type": "string",
										"required": true
									},
									"servicePort": {
										"type": "number",
										"required": true,
										"min": 4100
									},
									"requestTimeout": {
										"type": "number",
										"required": true
									},
									"requestTimeoutRenewal": {
										"type": "number",
										"required": true
									},
									"extKeyRequired": {
										"type": "boolean",
										"required": true
									},
									"session": {
										"type": "boolean",
										"required": false
									},
									"oauth": {
										"type": "boolean",
										"required": false
									},
									"dbs": {
										"type": "array",
										"required": false,
										"items": {
											"type": "object",
											"properties": {
												"prefix": {"type": "string"},
												"name": {"type": "string", "required": true},
												"multitenant": {"type": "boolean"}
											}
										},
										"minItems": 1,
										"uniqueItems": true
									}
								}
							},
							"yaml": {
								"type": "string",
								"required": true
							}
						}
					}
				}
			}
		},

		"put": {
			"/environment/update": {
				_apiInfo: {
					"l": "Update Environment",
					"group": "Environment"
				},
				"commonFields": ['id', 'description', 'services'],
				"domain": {
					"source": ['body.domain'],
					"required": true,
					"validation": {
						"type": "string",
						"format": "hostname"
					}
				},
				"apiPrefix": {
					"source": ['body.apiPrefix'],
					"required": false,
					"default": "api",
					"validation": {
						"type": "string"
					}
				},
				"sitePrefix": {
					"source": ['body.sitePrefix'],
					"required": false,
					"default": "site",
					"validation": {
						"type": "string"
					}
				},
				"custom": {
					"source": ['body.custom'],
					"required": false,
					"validation": {
						"type": "object"
					}
				}
			},

			"/environment/key/update": {
				_apiInfo: {
					"l": "Update Environment Tenant Key Security",
					"group": "Environment"
				},
				"commonFields": ['id'],
				"algorithm": {
					"source": ['body.algorithm'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"password": {
					"source": ['body.password'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},

			"/environment/dbs/update": {
				_apiInfo: {
					"l": "Update Environment Database",
					"group": "Environment Databases"
				},
				"env": {"source": ['query.env'], "required": true, "validation": {"type": "string", "required": true}},
				"name": {"source": ['body.name'], "required": true, "validation": {"type": "string", "required": true}},
				"cluster": {
					"source": ['body.cluster'],
					"required": true,
					"validation": {"type": "string", "required": true}
				},
				"tenantSpecific": {
					"source": ['body.tenantSpecific'],
					"required": false,
					"validation": {"type": "boolean", "required": true}
				},
				"sessionInfo": {
					"source": ['body.sessionInfo'],
					"required": false,
					"validation": {
						"type": "object",
						"required": true,
						"properties": {
							"store": {"type": "object", "required": true},
							"dbName": {"type": "string", "required": true},
							"expireAfter": {"type": "integer", "required": true},
							"collection": {"type": "string", "required": true},
							"stringify": {"type": "boolean", "required": true}
						}
					}
				}
			},

			"/environment/dbs/updatePrefix": {
				_apiInfo: {
					"l": "Update Environment Databases Prefix",
					"group": "Environment Databases"
				},
				"env": {"source": ['query.env'], "required": true, "validation": {"type": "string", "required": true}},
				"prefix": {
					"source": ['body.prefix'],
					"required": false,
					"validation": {"type": "string", "required": false}
				}
			},

			"/environment/clusters/update": {
				_apiInfo: {
					"l": "Update Environment Database Cluster",
					"group": "Environment Clusters"
				},
				"commonFields": ['cluster'],
				"env": {"source": ['query.env'], "required": true, "validation": {"type": "string", "required": true}},
				"name": {"source": ['query.name'], "required": true, "validation": {"type": "string", "required": true}}
			},

			"/environment/platforms/cert/choose": {
				_apiInfo: {
					"l": "Choose Existing Certificates",
					"group": "Environment Platforms"
				},
				"env": {
					"source": ['query.env'],
					"required": true,
					"validation": {
						"type": "string",
						"required": true
					}
				},
				"platform": {
					"source": ['query.platform'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"driverName": {
					"source": ['query.driverName'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"certIds": {
					"source": ['body.certIds'],
					"required": true,
					"validation": {
						"type": "array"
					}
				}
			},

			"/environment/platforms/driver/changeSelected": {
				_apiInfo: {
					"l": "Change Selected Driver",
					"group": "Environment Platforms"
				},
				"env": {
					"source": ['query.env'],
					"required": true,
					"validation": {
						"type": "string",
						"required": true
					}
				},
				"selected": {
					"source": ['body.selected'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},

			"/environment/platforms/deployer/type/change": {
				_apiInfo: {
					"l": "Change Deployer Type",
					"group": "Environment Platforms"
				},
				"env": {
					"source": ['query.env'],
					"required": true,
					"validation": {
						"type": "string",
						"required": true
					}
				},
				"deployerType": {
					"source": ['body.deployerType'],
					"required": true,
					"validation": {
						"type": "string",
						"enum": ["manual", "container"]
					}
				}
			},

			"/environment/platforms/deployer/update": {
				_apiInfo: {
					"l": "Change Deployer Type",
					"group": "Environment Platforms"
				},
				"env": {
					"source": ['query.env'],
					"required": true,
					"validation": {
						"type": "string",
						"required": true
					}
				},
				"driver": {
					"source": ['body.driver'],
					"required": true,
					"validation": {
						"type": "string",
						"enum": ['local', 'remote']
					}
				},
				"config": {
					"source": ['body.config'],
					"required": true,
					"validation": {
						"type": "object"
					}
				}
			},

			"/product/update": {
				_apiInfo: {
					"l": "Update Product",
					"group": "Product"
				},
				"commonFields": ['id', 'name', 'description']
			},

			"/product/packages/update": {
				_apiInfo: {
					"l": "Update Product Package",
					"group": "Product"
				},
				"commonFields": ['id', 'name', 'description', '_TTL', 'acl'],
				"code": {
					"source": ["query.code"],
					"required": true,
					"validation": {
						"type": "string",
						"format": "alphanumeric"
					}
				}
			},

			"/tenant/update": {
				_apiInfo: {
					"l": "Update Tenant",
					"group": "Tenant"
				},
				"commonFields": ['id', 'name', 'description'],
				"type": {
					"source": ['body.type'],
					"required": false,
					"default": "client",
					"validation": {
						"type": "string",
						"enum": ["admin", "product", "client"]
					}
				},
				"tag": {
					"source": ['body.tag'],
					"required": false,
					"validation": {
						"type": "string"
					}
				}
			},

			"/tenant/oauth/update": {
				_apiInfo: {
					"l": "Update Tenant oAuth Configuration",
					"group": "Tenant oAuth"
				},
				"commonFields": ['id', 'secret', 'redirectURI']
			},

			"/tenant/oauth/users/update": {
				_apiInfo: {
					"l": "Update Tenant oAuth User",
					"group": "Tenant oAuth"
				},
				"commonFields": ['id', 'uId'],
				"userId": {
					"source": ['body.userId'],
					"required": false,
					"validation": {
						"type": "string"
					}
				},
				"password": {
					"source": ['body.password'],
					"required": false,
					"validation": {
						"type": "string"
					}
				}
			},

			"/tenant/application/update": {
				_apiInfo: {
					"l": "Update Tenant Application",
					"group": "Tenant Application"
				},
				"_TTL": {
					"source": ['body._TTL'],
					"required": false,
					"validation": {
						"type": "string",
						"enum": ['6', '12', '24', '48', '72', '96', '120', '144', '168']
					}
				},
				"commonFields": ['id', 'appId', 'description', 'acl', 'productCode', 'packageCode', 'clearAcl']
			},

			"/tenant/application/key/ext/update": {
				_apiInfo: {
					"l": "Update Tenant Application External Key",
					"group": "Tenant Application"
				},
				"commonFields": ['id', 'appId', 'key', 'extKey', 'expDate', 'device', 'geo'],
				"extKeyEnv": {
					"source": ['query.extKeyEnv'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},

			"/tenant/application/key/config/update": {
				_apiInfo: {
					"l": "Update Tenant Application Key Configuration",
					"group": "Tenant Application"
				},
				"commonFields": ['id', 'appId', 'key', 'envCode', 'config']
			},

			"/settings/tenant/update": {
				_apiInfo: {
					"l": "Update Tenant",
					"group": "Tenant Settings"
				},
				"commonFields": ['name', 'description'],
				"type": {
					"source": ['body.type'],
					"required": false,
					"default": "client",
					"validation": {
						"type": "string",
						"enum": ["admin", "product", "client"]
					}
				}
			},

			"/settings/tenant/oauth/update": {
				_apiInfo: {
					"l": "Update Tenant oAuth Configuration",
					"group": "Tenant Settings"
				},
				"commonFields": ['secret', 'redirectURI']
			},

			"/settings/tenant/oauth/users/update": {
				_apiInfo: {
					"l": "Update Tenant oAuth User",
					"group": "Tenant Settings"
				},
				"commonFields": ['uId'],
				"userId": {
					"source": ['body.userId'],
					"required": false,
					"validation": {
						"type": "string"
					}
				},
				"password": {
					"source": ['body.password'],
					"required": false,
					"validation": {
						"type": "string"
					}
				}
			},

			"/settings/tenant/application/key/ext/update": {
				_apiInfo: {
					"l": "Update Tenant Application External Key",
					"group": "Tenant Settings"
				},
				"commonFields": ['appId', 'key', 'extKey', 'expDate', 'device', 'geo'],
				"extKeyEnv": {
					"source": ['query.extKeyEnv'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},

			"/settings/tenant/application/key/config/update": {
				_apiInfo: {
					"l": "Update Tenant Application Key Configuration",
					"group": "Tenant Settings"
				},
				"commonFields": ['appId', 'key', 'envCode', 'config']
			},

			"/daemons/groupConfig/update": {
				_apiInfo: {
					"l": "Update Daemon Group Configuration",
					"group": "Daemons"
				},
				'commonFields': ['id', 'groupName', 'daemon', 'cronTime', 'cronTimeDate', 'timeZone', 'interval', 'status', 'processing', 'jobs', 'order', 'solo'],
				'type':{
					"required": true,
					"source": ["body.type"],
					"validation":{
						"type": "string",
						"enum": ["interval", "cron", "once"]
					}
				}
			},

			"/daemons/groupConfig/serviceConfig/update": {
				_apiInfo: {
					"l": "Update Service Configuration",
					"group": "Daemons"
				},
				'commonFields': ['id', 'jobName'],
				'env': {
					'source': ['body.env'],
					'required': true,
					'validation': {
						'type': 'string'
					}
				},
				'config': {
					'source': ['body.config'],
					'required': true,
					'validation': {
						'type': 'object'
					}
				}
			},

			"/daemons/groupConfig/tenantExtKeys/update": {
				_apiInfo: {
					"l": "Update Job's External Keys",
					"group": "Daemons"
				},
				'commonFields': ['id', 'jobName'],
				'tenantExtKeys': {
					'source': ['body.tenantExtKeys'],
					'required': true,
					'validation': {
						'type': 'array'
					}
				},
				'tenantsInfo': {
					'source': ['body.tenantsInfo'],
					'required': true,
					'validation': {
						'type': 'array'
					}
				}
			},

			"/cloud/nodes/update": {
				"_apiInfo": {
					"l": "Update HA Cloud Node",
					"group": "HA Cloud"
				},
				"env": {
					"source": ['query.env'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"nodeId": {
					"source": ['query.nodeId'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"type": {
					"source": ['body.type'],
					"required": true,
					"validation": {
						"type": "string",
						"enum": ["role", "availability"]
					}
				},
				"value": {
					"source": ['body.value'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},

			"/cloud/services/scale": {
				"_apiInfo": {
					"l": "Scale HA Service",
					"group": "HA Cloud"
				},
				"env": {
					"source": ['body.env'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"serviceId": {
					"source": ['body.serviceId'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"scale": {
					"source": ['body.scale'],
					"required": true,
					"validation": {
						"type": "number"
					}
				}
			},

			"/cloud/services/redeploy": {
				"_apiInfo": {
					"l": "Redeploy HA Service",
					"group": "HA Cloud"
				},
				"env": {
					"source": ['body.env'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"serviceId": {
					"source": ['body.serviceId'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"mode": {
					"source": ['body.mode'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"ui": {
					"source": ['body.ui'],
					"required": false,
					"validation": {
						"type": "object",
						"properties": {
							"id": { "type": "string", "required": true },
							"branch": { "type": "string", "required": true },
							"commit": { "type": "string", "required": true }
						}
					}
				}
			},

			"/gitAccounts/repo/sync": {
				"_apiInfo": {
					"l": "Deactivate Repository",
					"group": "Git Accounts"
				},
				"id": {
					"source": ['query.id'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"provider": {
					"source": ['body.provider'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"project": {
					"source": ['body.project'],
					"required": false,
					"validation": {
						"type": "string"
					}
				},
				"owner": {
					"source": ['body.owner'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"repo": {
					"source": ['body.repo'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},

			"/cb/update": {
				"_apiInfo": {
					"l": "Update Content Schema",
					"group": "Content Builder"
				},
				"commonFields": ["id"],
				"config": {
					"required": true,
					"source": ["body.config"],
					"validation": cbSchema
				}
			},

			"/gitAccounts/repo/deactivate": {
				"_apiInfo": {
					"l": "Deactivate Repository",
					"group": "Git Accounts"
				},
				"id": {
					"source": ['query.id'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"owner": {
					"source": ['query.owner'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"repo": {
					"source": ['query.repo'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			}
		},

		"delete": {
			"/environment/delete": {
				_apiInfo: {
					"l": "Delete Environment",
					"group": "Environment"
				},
				"commonFields": ['id']
			},

			"/environment/dbs/delete": {
				_apiInfo: {
					"l": "Delete Environment Database",
					"group": "Environment Databases"
				},
				"env": {"source": ['query.env'], "required": true, "validation": {"type": "string", "required": true}},
				"name": {"source": ['query.name'], "required": true, "validation": {"type": "string", "required": true}}
			},

			"/environment/clusters/delete": {
				_apiInfo: {
					"l": "Delete Environment Database Cluster",
					"group": "Environment Clusters"
				},
				"env": {"source": ['query.env'], "required": true, "validation": {"type": "string", "required": true}},
				"name": {"source": ['query.name'], "required": true, "validation": {"type": "string", "required": true}}
			},

			"/environment/platforms/cert/delete": {
				_apiInfo: {
					"l": "Remove Certificate",
					"group": "Environment Platforms"
				},
				"id": {
					"source": ['query.id'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"env": {
					"source": ['query.env'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"driverName": {
					"source": ['query.driverName'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},

			"/product/delete": {
				_apiInfo: {
					"l": "Delete Product",
					"group": "Product"
				},
				"commonFields": ['id']
			},

			"/product/packages/delete": {
				_apiInfo: {
					"l": "Delete Product Package",
					"group": "Product"
				},
				"commonFields": ['id'],
				"code": {
					"source": ['query.code'],
					"required": true,
					"validation": {
						"type": "string",
						"format": "alphanumeric"
					}
				}
			},

			"/tenant/delete": {
				_apiInfo: {
					"l": "Delete Tenant",
					"group": "Tenant"
				},
				"commonFields": ['id']
			},

			"/tenant/oauth/delete": {
				_apiInfo: {
					"l": "Delete Tenant oAuth Configuration",
					"group": "Tenant oAuth"
				},
				"commonFields": ['id']
			},

			"/tenant/oauth/users/delete": {
				_apiInfo: {
					"l": "Delete Tenant oAuth User",
					"group": "Tenant oAuth"
				},
				"commonFields": ['id', 'uId']
			},

			"/tenant/application/delete": {
				_apiInfo: {
					"l": "Delete Tenant Application",
					"group": "Tenant Application"
				},
				"commonFields": ['id', 'appId']
			},

			"/tenant/application/key/delete": {
				_apiInfo: {
					"l": "Delete Tenant Application Key",
					"group": "Tenant Application"
				},
				"commonFields": ['id', 'appId', 'key']
			},

			"/settings/tenant/oauth/delete": {
				_apiInfo: {
					"l": "Delete Tenant oAuth Configuration",
					"group": "Tenant Settings"
				}
			},

			"/settings/tenant/oauth/users/delete": {
				_apiInfo: {
					"l": "Delete Tenant oAuth User",
					"group": "Tenant Settings"
				},
				"commonFields": ['uId']
			},

			"/settings/tenant/application/key/delete": {
				_apiInfo: {
					"l": "Delete Tenant Application Key",
					"group": "Tenant Settings"
				},
				"commonFields": ['appId', 'key']
			},

			"/daemons/groupConfig/delete": {
				_apiInfo: {
					"l": "Delete Daemon Group Configuration",
					"group": "Daemons"
				},
				'commonFields': ['id']
			},

			"/cloud/nodes/remove": {
				"_apiInfo": {
					"l": "Remove HA Cloud Node",
					"group": "HA Cloud"
				},
				"env": {
					"source": ['query.env'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"nodeId": {
					"source": ['query.nodeId'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},

			"/cloud/services/delete": {
				"_apiInfo": {
					"l": "Delete HA Service",
					"group": "HA Cloud"
				},
				"env": {
					"source": ['query.env'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"serviceId": {
					"source": ['query.serviceId'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"mode": {
					"source": ['query.mode'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},

			"/cloud/namespaces/delete": {
				"_apiInfo": {
					"l": "Delete a Namespace",
					"group": "HA Cloud"
				},
				"namespaceId": {
					"source": ['query.namespaceId'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},

			"/gitAccounts/logout": {
				"_apiInfo": {
					"l": "Github Logout",
					"group": "Git Accounts"
				},
				"id": {
					"source": ['query.id'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"provider": {
					"source": ['query.provider'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"username": {
					"source": ['query.username'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"password": {
					"source": ['query.password'],
					"required": false,
					"validation": {
						"type": "string"
					}
				}
			}
		}
	}
};
