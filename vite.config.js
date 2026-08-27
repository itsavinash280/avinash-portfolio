import { defineConfig } from "vite";

export default defineConfig({
  appType: "mpa",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        events: "events.html",
        gdgMeetup: "gdg-meetup.html",
        concerts: "concerts.html",
        portraits: "portraits.html",
        brands: "brands.html",
        hackersMeetup: "hackers-meetup.html",
        cloudNativeMeetup: "cloud-native-meetup.html",
        nerdsHackDays: "nerds-hack-days.html",
        vaptCybersecurityWorkshop: "vapt-cybersecurity-workshop.html",
        androidLucknow: "android-lucknow.html",
      },
    },
  },
});
