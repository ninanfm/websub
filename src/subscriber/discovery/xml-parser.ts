import cheerio from 'cheerio';
import {Response} from 'got/dist/source';
import {DiscoveryResult, LinkParser} from './types';

export class XMLParser implements LinkParser {
  isSupport(contentType: string): boolean {
    return /\/((.*?\+)?xml|html)/.test(contentType);
  }

  parse(res: Response<string>): Partial<DiscoveryResult> {
    const $ = cheerio.load(res.body);

    const hubUrl = $('atom\\:link[rel="hub"], link[rel="hub"]')
      .first()
      .attr('href');

    const selfUrl = $('atom\\:link[rel="self"], link[rel="self"]')
      .first()
      .attr('href');

    return {
      hubUrl,
      selfUrl,
    };
  }
}
