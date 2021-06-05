import {Response} from 'got/dist/source';
import {DiscoveryResult, LinkParser} from './types';
import * as parseLinkHeader from 'parse-link-header';

export class HeaderParser implements LinkParser {
  isSupport(): boolean {
    return true;
  }

  parse(res: Response<string>): Partial<DiscoveryResult> {
    const linkHeaders = (res.headers['link'] || '') as string;
    const parsed = parseLinkHeader(linkHeaders);

    return {
      hubUrl: parsed?.hub?.url,
      selfUrl: parsed?.self?.url,
    };
  }
}
