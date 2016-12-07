"use strict";

var serviceConfig = {
	"required": true,
	"type": "object",
	"properties": {
		"awareness": {
			"type": "object",
			"required": true,
			"properties": {
				"healthCheckInterval": {"type": "integer", "required": true, "min": 5000},
				"autoRelaodRegistry": {"type": "integer", "required": true, "min": 60000},
				"maxLogCount": {"type": "integer", "required": true, "min": 5},
				"autoRegisterService": {"type": "boolean", "required": true}
			}
		},
		"agent": {
			"type": "object",
			"required": true,
			"properties": {
				"topologyDir": {"type": "string", "required": true}
			}
		},
		"key": {
			"type": "object",
			"required": true,
			"properties": {
				"algorithm": {"type": "string", "required": true},
				"password": {"type": "string", "required": true, "minLength": 5}
			}
		},
		"logger": { //ATTENTION: this is not all the properties for logger
			"type": "object",
			"required": true,
			"additionalProperties": true
		},
		"cors": {
			"type": "object",
			"required": true,
			"additionalProperties": true
		},
		"oauth": {
			"type": "object",
			"required": true,
			"properties": {
				"grants": {"type": "array", "items": {"type": "string", "required": true}, "required": true},
				"debug": {"type": "boolean", "required": true}
			}
		},
		"ports": {
			"type": "object",
			"required": true,
			"properties": {
				"controller": {"type": "integer", "required": true},
				"maintenanceInc": {"type": "integer", "required": true, "min": 1000},
				"randomInc": {"type": "integer", "required": true, "min": 100}
			}
		},
		"session": {
			"type": "object",
			"required": true,
			"properties": {
				"name": {"type": "string", "required": true, "minLength": 5},
				"resave": {"type": "boolean", "required": true},
				"saveUninitialized": {"type": "boolean", "required": true},
				"proxy": {"type": 'string', "required": true, "enum": ['true', 'false', 'undefined']},
				"rolling": {"type": "boolean", "required": true},
				"unset": {"type": "string", "required": true, "enum": ['keep', 'destroy']},
				"cookie": {
					"type": "object",
					"required": true,
					"properties": {
						"path": {"type": "string", "required": true},
						"httpOnly": {"type": "boolean", "required": true},
						"secure": {"type": "boolean", "required": true},
						"maxAge": {"type": ["integer", "null"], "required": false}
					}
				}
			}
		}
	}
};
module.exports = serviceConfig;
