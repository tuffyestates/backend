#!/usr/bin/env node

import {generatePropertyImages} from '../../src/api/v1/properties';
import fs from 'fs';

// TODO: Use properties json file rather than manually defining the images/propertyIds
const images = {
    '5c02e61ae9383d4866fbe92e': 'test/data/images/annie-spratt-390892-unsplash.jpg',
    '5c02e61ae9383d4866fbe92f': 'test/data/images/brian-babb-256298-unsplash.jpg',
    '5c02e61ae9383d4866fbe93e': 'test/data/images/christopher-harris-55545-unsplash.jpg',
    '5c02e61ae9383d4866fbe94e': 'test/data/images/eduard-militaru-129399-unsplash.jpg',
};

(async() => {

  for (const [id, path] of Object.entries(images)) {
    await generatePropertyImages({[id]: fs.readFileSync(path)});
  }

  return "Successful import of images.";
})().then(console.log, console.error);
