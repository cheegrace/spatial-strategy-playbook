// The seven trends on the page. Shared by the page (playbook.js), the
// blueprint function (strategy.mjs) and the mockup function (mockup.mjs).
// Each id matches an article on the page: <article id="t-{id}">.
// `tactics` are the case study tags the trend draws on (meta.tag_vocab).
// `scene` is the fixed image direction the render adds for that trend.

export const TRENDS = [
  {
    id: "fun",
    tactics: ["installation_art", "sports_play_zones", "immersive_popup", "gamified_trial", "rotating_takeover"],
    name: "Make the store fun",
    summary: "Play, art, and spectacle give people a reason to visit that no website can match. Fun works hardest as a product trial.",
    scene: "The centerpiece is a playful, oversized sculptural installation that shoppers climb, touch, or play with, doubling as a product trial.",
  },
  {
    id: "tech",
    tactics: ["ecosystem_demo", "personalization", "fit_diagnosis", "ar_window", "retail_media_screens"],
    name: "Tech that earns its place",
    summary: "Store technology either helps the shopper choose, through fitting, diagnosis, and recommendation, or tells the brand's story through the space. Walls of campaign video are out.",
    scene: "The centerpiece is a hands on demo area where shoppers pick up products and interactive displays built into the furniture respond, with no large video walls.",
  },
  {
    id: "programming",
    tactics: ["programming_events", "clubs", "circularity_repair", "launch_event"],
    name: "Programming and clubs over product",
    summary: "A calendar of classes, clubs, events, and repairs brings people back between purchases.",
    scene: "The centerpiece is a flexible community space in the middle of a session, with a small group gathered on modular seating for a class or club meetup.",
  },
  {
    id: "custom",
    tactics: ["customization", "culture_partner", "launch_event"],
    name: "Customization and limited drops",
    summary: "Making a product your own, often with local artists and limited drops, moves from a side counter to the centerpiece.",
    scene: "The centerpiece is a customization bar where staff and shoppers personalize products together at a long workbench with tools within reach.",
  },
  {
    id: "hospitality",
    tactics: ["hospitality", "calm_sensory", "category_breaking"],
    name: "Retail meets hospitality",
    summary: "Cafés and lounges move from extras to the core of the store. They offer a low entry point, a reason to linger, and a venue for programming.",
    scene: "The centerpiece is a café bar and lounge seating woven into the sales floor, with people lingering over coffee next to the products.",
  },
  {
    id: "tiers",
    tactics: ["small_format", "tiered_formats", "partner_store"],
    name: "Tiered formats, each with a job",
    summary: "Flagships carry the big experiences. Smaller stores and partner shops serve neighborhoods with a tighter range edited for the area.",
    scene: "The space is a compact neighborhood store with a tightly edited range, local materials and artwork, and a warm, intimate scale.",
  },
  {
    id: "window",
    tactics: ["ar_window", "installation_art", "immersive_popup"],
    name: "Windows that do something",
    summary: "The window is the first zone of the visit. The strongest respond to people on the street and promise what the store delivers inside.",
    scene: "The view looks from just inside the entrance toward a striking, responsive storefront window display with one hero installation, the street visible beyond.",
  },
];

export const TREND_IDS = TRENDS.map((t) => t.id);
