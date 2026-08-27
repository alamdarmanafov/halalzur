/**
 * Ingredient-label text recognition.
 *
 * This is a placeholder — no OCR engine is wired up yet, so it always
 * resolves to an empty string and the caller falls back to letting the
 * user type/correct the ingredient text by hand.
 *
 * To make this real, pick one:
 *   (a) On-device: `@react-native-ml-kit/text-recognition` — needs a
 *       custom native build (EAS Build + a dev client), it will NOT run
 *       inside Expo Go.
 *   (b) Cloud: Google Cloud Vision / AWS Textract / a vision-capable LLM
 *       — call it from a backend endpoint, never with an API key embedded
 *       in the app, and upload the captured photo to that endpoint here.
 *
 * Either way, this function's job stays the same: turn a photo into raw
 * text. Halalzur never asks the OCR/AI step to judge halal status — that
 * text is only ever fed into `extractECodesFromText` for the fixed E-code
 * lookup in `lib/eCodes.ts`.
 */
export async function recognizeIngredientText(_photoUri: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return '';
}
