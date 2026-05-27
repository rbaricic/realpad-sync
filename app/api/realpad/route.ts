import { XMLParser } from "fast-xml-parser";

export async function GET() {
  const response = await fetch(
    "https://cms.realpad.eu/ws/v10/get-project",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },

      body: new URLSearchParams({
        login: process.env.REALPAD_LOGIN || "",
        password: process.env.REALPAD_PASSWORD || "",
        projectid: process.env.REALPAD_PROJECT_ID || "",
        developerid: process.env.REALPAD_DEVELOPER_ID || "",
        screenid: process.env.REALPAD_SCREEN_ID || "",
      }),
    }
  );

  const xmlText = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });

  const parsedData = parser.parse(xmlText);

  const buildings = parsedData?.export?.project?.building || [];

  const allFlats: any[] = [];

  const statusMap: Record<string, string> = {
    "0": "Sold",
    "1": "Reserved",
    "2": "Available",
    "3": "Available",
  };

  const getAttr = (flat: any, key: string) => {
    const attributes = flat["flat-attribute"] || [];

    const found = attributes.find((attr: any) => attr.key === key);

    return found?.value || null;
  };

  for (const building of buildings) {
    const floors = building.floor || [];

    for (const floor of floors) {
      const flats = floor.flat || [];

      for (const flat of flats) {
        allFlats.push({
          id: getAttr(flat, "flat_internal_id"),

          title: getAttr(flat, "flat_disposition"),

          area: Number(getAttr(flat, "flat_area")),

          price: Number(getAttr(flat, "flat_price")),

          status:
            statusMap[getAttr(flat, "flat_status")] || "Unknown",

          floor: Number(floor.floorNo),

          pdf: flat.pdf || null,
        });
      }
    }
  }

  return Response.json(allFlats);
}