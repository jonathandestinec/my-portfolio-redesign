// Inputs for each project film. Every image is a real capture of the live site
// (scripts/capture-screenshots.ts), served from ../public/work.
// Palette roles follow the film recipe; each project maps its own brand onto them.
window.FILM_PROJECTS = {
  "royal-beads-edo": {
    name: "Taoué",
    pill: "Royal Beads Edo",
    host: "royal-beads-edo.vercel.app",
    icon: "../public/work/royal-beads-edo/film/icon.svg",
    mark: "cowrie",
    palette: {
      page: "#FBF6EF", haze: "#E8D9C0", ice: "#F5EDE3", floor: "#F1E2CC",
      deepA: "#4A3022", deepB: "#A5502F", navy: "#2B1D18",
      a1: "#D2503B", a2: "#C9A25E", a3: "#E8755F",
    },
    windowCard: { image: "../public/work/royal-beads-edo/cover/image.jpg", title: "Taoué by Royal Beads Edo", sub: "Live · coral beads, Benin City" },
    prompt: "Show me coral sets for my wedding",
    answer: { image: "../public/work/royal-beads-edo/chapters/0/images/0/image.jpg", cursor: [450, 591] },
    card: { image: "../public/work/royal-beads-edo/chapters/1/images/1/image.jpg", caption: "See it on you", sub: "Virtual try-on, in the browser" },
    cards: [
      { image: "../public/work/royal-beads-edo/chapters/1/images/0/image.jpg", pill: "Try-on", title: "Try on" },
      { image: "../public/work/royal-beads-edo/chapters/3/images/1/image.jpg", pill: "Automation", title: "Enquire" },
    ],
  },
  huddle: {
    name: "Huddle",
    pill: "for communities",
    host: "huddleplat.vercel.app",
    icon: "../public/work/huddle/film/icon.svg",
    mark: "huddle",
    palette: {
      page: "#FDFDFB", haze: "#FBF3B0", ice: "#FFFBE0", floor: "#FFF7C4",
      deepA: "#1A1A1A", deepB: "#5A5640", navy: "#1A1A1A",
      a1: "#FEF16C", a2: "#F2C94C", a3: "#1A1A1A",
    },
    windowCard: { image: "../public/work/huddle/cover/image.png", title: "Huddle", sub: "Live · events for communities" },
    prompt: "Give everyone a number for Sunday",
    answer: { image: "../public/work/huddle/chapters/1/images/0/image.png", cursor: [450, 591] },
    card: { image: "../public/work/huddle/chapters/2/images/1/image.png", caption: "Number Picker", sub: "Pick a number, pay, done" },
    cards: [
      { image: "../public/work/huddle/chapters/0/images/0/image.png", pill: "Functions", title: "Events" },
      { image: "../public/work/huddle/chapters/3/images/0/image.png", pill: "Paystack", title: "Payouts" },
    ],
  },
  agrohub: {
    name: "AgroHub",
    pill: "for cooperatives",
    host: "agro-hub.com.ng",
    icon: "../public/work/agrohub/film/icon.svg",
    mark: "leaves",
    palette: {
      page: "#FDFDFB", haze: "#E8F3B8", ice: "#F4FADB", floor: "#EEF7C8",
      deepA: "#173A2A", deepB: "#4E7A2E", navy: "#173A2A",
      a1: "#DCEF6A", a2: "#8BC34A", a3: "#2F6B3A",
    },
    windowCard: { image: "../public/work/agrohub/cover/image.png", title: "AgroHub", sub: "Live · agro-hub.com.ng" },
    prompt: "Sell our maize to bulk buyers",
    answer: { image: "../public/work/agrohub/chapters/0/images/0/image.png", cursor: [450, 591] },
    card: { image: "../public/work/agrohub/chapters/2/images/1/image.png", caption: "Harvest lots", sub: "Built for phones first" },
    cards: [
      { image: "../public/work/agrohub/chapters/0/images/0/image.png", pill: "Catalogue", title: "Lots" },
      { image: "../public/work/agrohub/chapters/1/images/0/image.png", pill: "Weekly", title: "Prices" },
    ],
  },
};
