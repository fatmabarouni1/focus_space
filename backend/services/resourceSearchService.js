const SERPER_API_KEY = process.env.SERPER_API_KEY || "";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
};

const toCleanString = (value) => String(value ?? "").trim();

const searchSerperOrganicResults = async (query) => {
  if (!SERPER_API_KEY) {
    throw new Error("SERPER_API_KEY is not configured.");
  }

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      ...FETCH_HEADERS,
      "Content-Type": "application/json",
      "X-API-KEY": SERPER_API_KEY,
    },
    body: JSON.stringify({
      q: query,
      gl: "fr",
      hl: "fr",
      num: 10,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Serper search failed with status ${response.status}.`);
  }

  const data = await response.json();
  const organic = Array.isArray(data?.organic) ? data.organic : [];

  return organic
    .map((item, index) => ({
      title: toCleanString(item?.title),
      link: toCleanString(item?.link),
      snippet: toCleanString(item?.snippet),
      position:
        Number.isFinite(Number(item?.position)) && Number(item.position) > 0
          ? Number(item.position)
          : index + 1,
    }))
    .filter((item) => item.title && item.link);
};

export { searchSerperOrganicResults };
