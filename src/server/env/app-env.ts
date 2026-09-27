import { cleanEnv, url } from "envalid";

export type AppEnv = {
  APP_BASE_URL: string;
};

export function readAppEnv(): AppEnv {
  const env = cleanEnv(process.env, {
    APP_BASE_URL: url({
      desc: "Application root URL used for redirects and registered for logout",
      example: "http://localhost:3000/",
    }),
  });

  return { APP_BASE_URL: env.APP_BASE_URL };
}
