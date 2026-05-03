const WIKIMEDIA_API_URL = "https://commons.wikimedia.org/w/api.php";

export type ExerciseImageResult = {
  imageUrl: string;
  sourceUrl: string;
  sourceName: "Wikimedia Commons";
};

type WikimediaImageInfo = {
  url: string;
  descriptionurl: string;
};

type WikimediaPage = {
  imageinfo?: WikimediaImageInfo[];
};

type WikimediaSearchResponse = {
  query?: {
    pages?: Record<string, WikimediaPage>;
  };
};

export async function searchExerciseImage(
  exerciseName: string,
): Promise<ExerciseImageResult | null> {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${exerciseName} exercise gym`,
    gsrlimit: "1",
    prop: "imageinfo",
    iiprop: "url",
    format: "json",
    origin: "*",
  });

  const response = await fetch(`${WIKIMEDIA_API_URL}?${params.toString()}`);
  const data = (await response.json()) as WikimediaSearchResponse;
  const page = Object.values(data.query?.pages ?? {})[0];
  const imageInfo = page?.imageinfo?.[0];

  if (!imageInfo) {
    return null;
  }

  return {
    imageUrl: imageInfo.url,
    sourceUrl: imageInfo.descriptionurl,
    sourceName: "Wikimedia Commons",
  };
}
