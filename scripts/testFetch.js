const fetchData = require('../netlify/functions/fetchData.js');

(async () => {
  try {
    console.log('Running fetchData.handler (force=1) ...');
    const res = await fetchData.handler({ queryStringParameters: { force: '1' } });
    console.log('status:', res.statusCode);
    const body = JSON.parse(res.body);
    console.log('optionsCount:', body.optionsCount);
    if (body.optionsSample && body.optionsSample[0]) {
      console.log('sample option:', JSON.stringify(body.optionsSample[0], null, 2));
    }
    process.exit(0);
  } catch (e) {
    console.error('Error running fetch:', e);
    process.exitCode = 1;
  }
})();
