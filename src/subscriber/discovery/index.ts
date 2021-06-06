import got from 'got/dist/source';
import {URL} from 'url';
import {DiscoveryError} from '../errors';
import {HeaderParser} from './header-parser';
import {DiscoveryResult, LinkParser} from './types';
import {XMLParser} from './xml-parser';
import debug from './debug';

export * from './types';

export class Discoverer {
  private parsers: LinkParser[] = [new HeaderParser(), new XMLParser()];

  registerParser(parser: LinkParser) {
    this.parsers.push(parser);
  }

  async discover(url: string): Promise<DiscoveryResult> {
    debug(`discover ${url}`);

    const result: Partial<DiscoveryResult> = {};

    try {
      const res = await got.get(url, {followRedirect: true});
      const contentType = res.headers['content-type'] || '';

      for (const parser of this.parsers) {
        if (parser.isSupport(contentType)) {
          debug(`using ${parser.constructor.name} to parse response`);

          const parsingResult = parser.parse(res);
          Object.assign(result, parsingResult);
          debug(`parsing result ${JSON.stringify(parsingResult)}`);

          if (result.hubUrl && result.selfUrl) {
            debug('all required informations have been found');
            break;
          }
        }
      }
    } catch (err) {
      throw new DiscoveryError(err.message);
    }

    if (!result.hubUrl) {
      throw new DiscoveryError('could not find hub url');
    }

    if (!result.selfUrl) {
      throw new DiscoveryError('could not find self url');
    }

    const normalizedResult = {
      hubUrl: normalizeUrl(url, result.hubUrl),
      selfUrl: normalizeUrl(url, result.selfUrl),
    };

    debug(`result ${JSON.stringify(normalizedResult)}`);

    return normalizedResult;
  }
}

function normalizeUrl(baseUrl: string, targetUrl: string): string {
  if (!/^[/.]/.test(targetUrl)) {
    return targetUrl;
  }
  const url = new URL(baseUrl);
  url.pathname = targetUrl;
  return url.toString();
}
