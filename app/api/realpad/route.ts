import {
  fetchRealpadXML,
  parseRealpadXML,
  mapFlats,
} from "@/lib/realpad";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const statusFilter = searchParams.get("status");

  const floorFilter = searchParams.get("floor");

  const xmlText = await fetchRealpadXML();

  const parsedData = parseRealpadXML(xmlText);

  const allFlats = mapFlats(parsedData);

  let filteredFlats = allFlats;

  if (statusFilter) {
    filteredFlats = filteredFlats.filter(
      (flat: any) => flat.status === statusFilter
    );
  }

  if (floorFilter) {
    filteredFlats = filteredFlats.filter(
      (flat: any) => flat.floor === Number(floorFilter)
    );
  }

  return Response.json(filteredFlats);
}