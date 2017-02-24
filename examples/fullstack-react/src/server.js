import express from 'express';
import ejs from 'ejs';
import Promise from 'bluebird';
import 'babel-polyfill';

module.exports = () => {
  const app = express();

  app.get('/', async (req, res) => {
    const templatePath = './src/index.ejs';
    const data = {
      title: 'Wix Full Stack Project Boilerplate',
      staticsBaseUrl: 'http://localhost:3200/', //TODO: fix
      baseurl: 'http://localhost:3000/', //TODO: fix
      locale: 'en' //TODO: fix
    };

    const renderFile = await Promise.promisify(ejs.renderFile, {context: ejs});

    const htmlData = await renderFile(templatePath, data);

    res.send(htmlData);
  });

  return app;
};
