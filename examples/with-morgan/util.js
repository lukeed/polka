// SUPER basic send() helper
// ~> Just setting Content-Length
// ~> because Morgan wants to print it
exports.send = function (res, data) {
	res.setHeader('Content-Length', data.length);
	res.end(data);
}
