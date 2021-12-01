import chrome from 'chrome-aws-lambda';
import { writeFileSync } from 'fs';

// import type { NextApiRequest, NextApiResponse } from 'next';

module.exports = async (req, res) => {
    const url = `https://www.birthblock.art/`;
    const NODE_ENV = process.env.NODE_ENV;
    console.log(NODE_ENV);

    const browser = await chrome.puppeteer.launch(
        NODE_ENV === 'production' || 'staging'
            ? {
                  args: chrome.args,
                  executablePath: await chrome.executablePath,
                  headless: chrome.headless,
              }
            : {},
    );
    const page = await browser.newPage();
    page.setUserAgent(
        'Opera/9.80 (J2ME/MIDP; Opera Mini/5.1.21214/28.2725; U; ru) Presto/2.8.119 Version/11.10',
    );

    await page.goto(url);
    await page.waitForTimeout(600);
    let img = await page.screenshot({
        // Screenshot the website using defined options
        fullPage: true,
        type: 'jpeg',
        quality: 80,
    });
    await page.close(); // Close the website so app won't get crashed due to memory overload

    await browser.close();

    res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': Buffer.byteLength(img),
    });
    res.end(img);
};
