import * as BbPromise from "bluebird";
import * as debug from "debug";

import { Driver } from "./driver";
import { Prerender } from "./prerender";
import { PrerenderStrategy, S3CacheStrategy } from "./strategies";

import { Context, Event, HandlerCallback } from "./interfaces/lambda-proxy";

const prerender = new Prerender(
  new Driver({
    disableServerlessChrome: !process.env.AWS_EXECUTION_ENV,
    // userAgent: "YOUR-CUSTOM-USER-AGENT",
  }),
);

prerender.use(
  // S3CacheStrategy can be optional
  new S3CacheStrategy({
    Bucket: "serverless-prerender-cache",
    KeyPrefix(url: string) {
      const match = url.match("^(?:https?:\\/\\/)?(?:[^@\\/\\n]+@)?(?:www\\.)?([^:\\/?\\n]+)");
      if (match && match.length >= 2) {
        return match[1];
      } else {
        return url;
      }
    },
    ExpiresInSeconds: 3600 * 24 * 3,
    // keyMapper(url: string) {
    //   const match = url.match("^(?:https?:\/\/)?(?:[^@\/\n]+@)?(.*)$");
    //   if (match && match.length >= 2) {
    //       return match[1];
    //   } else {
    //       return url;
    //   }
    // },
  }),
  new PrerenderStrategy({
    waitForPrerenderReady: false,
    stripScripts: true,
    // timeout: CUSTOM_NAVIGATION_TIMEOUT,
  }),
);

export function handler(event: Event, context: Context, callback: HandlerCallback) {
  BbPromise.resolve(
    prerender.handleEvent(event, 60000),
  ).asCallback(callback);
}
