var index = require('../index');
var should = require('should');

describe('index', function() {
	describe('handler', function() {
		it('should compile', function() {
			index.handler.should.be.ok();
		});
	});
});