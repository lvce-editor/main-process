import { expect, jest, test } from '@jest/globals'

jest.unstable_mockModule('electron', () => ({}))

const ElectronBrowserViewAdBlock = await import('../src/parts/ElectronBrowserViewAdBlock/ElectronBrowserViewAdBlock.ts')

const getResponse = (url: string, resourceType = 'script', method = 'GET'): Readonly<Record<string, unknown>> => {
  let response: Readonly<Record<string, unknown>> = {}
  ElectronBrowserViewAdBlock.handleBeforeRequest(
    {
      method,
      resourceType,
      url,
    },
    (value) => {
      response = value
    },
  )
  return response
}

test.each([
  'https://c.amazon-adsystem.com/aax2/apstag.js',
  'https://cadmus.script.ac/d24657ks8lvxjy/script.js',
  'https://config.aps.amazon-adsystem.com/configs/example',
  'https://dn0qt3r0xannq.cloudfront.net/soundcloud-example/prebid-load.js',
  'https://dn0qt3r0xannq.cloudfront.net/components/refresh-all-ads-component.js',
  'https://edge.aditude.io/prebid/9.19.0.js',
  'https://ep1.adtrafficquality.google/pagead/sodar',
  'https://event-ingestor.judy.pnap.aditude.cloud/event',
  'https://pagead2.googlesyndication.com/gampad/ads',
  'https://raven-static.aditude.io/prod/prebid-analytics.js',
  'https://securepubads.g.doubleclick.net/pagead/managed/gpt',
  'https://subdomain.safeframe.googlesyndication.com/safeframe/container.html',
])('blocks an observed SoundCloud advertising request: %s', (url) => {
  expect(getResponse(url)).toEqual({ cancel: true })
})

test.each([
  'https://api-v2.soundcloud.com/search/tracks?q=music',
  'https://example.com/.safeframe.googlesyndication.com/content',
  'https://playback.media-streaming.soundcloud.cloud/media/example/128/track.mp3',
  'https://soundcloud.com/photay/communication',
])('allows SoundCloud page, API, and audio requests: %s', (url) => {
  expect(getResponse(url, 'xhr')).toEqual({})
})
