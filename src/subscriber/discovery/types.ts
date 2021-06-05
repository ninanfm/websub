import {Response} from 'got/dist/source';

export interface LinkParser {
  isSupport(contentType: string): boolean;
  parse(res: Response<string>): Partial<DiscoveryResult>;
}

export interface DiscoveryResult {
  selfUrl: string;
  hubUrl: string;
}
