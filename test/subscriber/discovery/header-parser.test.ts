import got from 'got/dist/source';
import * as nock from 'nock';
import {HeaderParser} from '../../../src/subscriber/discovery/header-parser';
import {getRequestFixture} from '../../utils';

describe('HeaderParser', () => {
  describe('#parse(feedUrl)', () => {
    describe('Link Headers', () => {
      beforeEach(() => {
        const {headers} = getRequestFixture('link-headers.json');
        nock('https://test').head('/feed').reply(200, '', headers);
      });

      it('should pass', async () => {
        const parser = new HeaderParser();
        const response = await got.head('https://test/feed');
        const discoveryResult = parser.parse(response);
        expect(discoveryResult).toStrictEqual({
          hubUrl: 'https://hub.example.com/',
          selfUrl: '/feed',
        });
      });
    });
  });
});
