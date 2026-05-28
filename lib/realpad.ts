import { XMLParser } from "fast-xml-parser";

export async function fetchRealpadXML() {
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

  return response.text();
}

export function parseRealpadXML(xmlText: string) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });

  return parser.parse(xmlText);
}

export function mapFlats(parsedData: any) {
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
        
        console.log(flat);

        const baseUrl = "https://realpad-sync.vercel.app";

        const flatNumber = getAttr(flat, "flat_internal_id");
        
        allFlats.push({
          id: getAttr(flat, "flat_internal_id"),

          title: getAttr(flat, "flat_disposition"),

          area: Number(getAttr(flat, "flat_area")),

          livingArea: Number(getAttr(flat, "flat_area_living")),

          balcony: Number(getAttr(flat, "flat_area_balcony")),

          terrace: Number(getAttr(flat, "flat_area_terrace")),

          loggia: Number(getAttr(flat, "flat_area_loggia")),

          garden: Number(getAttr(flat, "flat_area_garden")),

          orientation: getAttr(flat, "flat_orientation"),

          number: getAttr(flat, "flat_internal_id"),

          type: getAttr(flat, "flat_type"),

          category: getAttr(flat, "flat_category"),

          priceWithoutVat: Number(getAttr(flat, "flat_price_without_vat")),

          discountVat: Number(getAttr(flat, "flat_discount_vat")),

          beforeDiscountVat: Number(
            getAttr(flat, "flat_price_before_discount_vat")
          ),

          price: Number(getAttr(flat, "flat_price")),

          status:
            statusMap[getAttr(flat, "flat_status")] || "Unknown",

          floor: Number(floor.floorNo),

          floorplan: {
            id: flat.picture?.id || null,
            resource: flat.picture?.resource || null,
          },

          floorplanUrl:
            `${baseUrl}/floorplans/bytyPNG/${flatNumber}_1.png`,

          buildingSituationUrl:
            `${baseUrl}/floorplans/situaciePNG/${flatNumber}_2.png`,

          floorSituationUrl:
            `${baseUrl}/floorplans/situaciePNG/${flatNumber}_3.png`,

          pdf: flat.pdf || null,

          images: flat.picture
          ? [
              {
                 id: flat.picture.id,
                  resource: flat.picture.resource,
                  type: "floorplan",
              },
            ]
          : [],
        });
      }
    }
  }

  return allFlats;
}