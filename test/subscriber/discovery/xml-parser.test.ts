import got from 'got/dist/source';
import * as nock from 'nock';
import {XMLParser} from '../../../src/subscriber/discovery/xml-parser';
import {getRequestFixture} from '../../utils';

describe('XMLParser', () => {
  describe('#parse(feedUrl)', () => {
    describe('Link Headers', () => {
      beforeEach(() => {
        const {headers, content} = getRequestFixture('rss.xml');
        nock('https://test').get('/feed').reply(200, content, headers);
      });

      it('should pass', async () => {
        const parser = new XMLParser();
        const response = await got.get('https://test/feed');
        const discoveryResult = parser.parse(response);
        expect(discoveryResult).toStrictEqual({
          hubUrl: 'https://pubsubhubbub.appspot.com/',
          selfUrl: 'https://anchor.fm/s/1ea77470/podcast/rss',
        });
      });
    });
  });
});
