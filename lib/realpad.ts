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

  // REALPAD STATUS MAP
  const statusMap: Record<string, string> = {
    "0": "VOLNÝ",
    "1": "V JEDNÁNÍ",
    "2": "PRODANÝ",
    "3": "PRODANÝ",
  };

  // HIDE COMPLETELY
  const hiddenStatuses = ["4", "5"];

  // HIDE PRICE
  const hidePriceStatuses = ["2", "3"];

  const getAttr = (flat: any, key: string) => {
    const attributes = flat["flat-attribute"] || [];

    const found = attributes.find(
      (attr: any) => attr.key === key
    );

    return found?.value || null;
  };

  for (const building of buildings) {
    const floors = building.floor || [];

    for (const floor of floors) {
      const flats = floor.flat || [];

      for (const flat of flats) {

        const baseUrl =
          "https://realpad-sync.vercel.app";

        const flatNumber =
          getAttr(flat, "flat_internal_id");

        const rawStatus =
          getAttr(flat, "flat_status");

        // HIDE FLATS WITH STATUS 4 / 5
        const isVisible =
          !hiddenStatuses.includes(rawStatus);

        if (!isVisible) continue;

        // HIDE PRICE FOR SOLD FLATS
        const hidePrice =
          hidePriceStatuses.includes(rawStatus);

        // AREAS
        const balcony =
          Number(getAttr(flat, "flat_area_balcony")) || 0;

        const terrace =
          Number(getAttr(flat, "flat_area_terrace")) || 0;

        const loggia =
          Number(getAttr(flat, "flat_area_loggia")) || 0;

        const exteriorArea =
          balcony + terrace + loggia;

        allFlats.push({
          // BASIC
          id: flatNumber,

          number: flatNumber,

          title:
            getAttr(flat, "flat_disposition"),

          disposition:
            getAttr(flat, "flat_disposition"),

          type:
            getAttr(flat, "flat_type"),

          category:
            getAttr(flat, "flat_category"),

          // FLOOR
          floor:
            Number(floor.floorNo),

          // STATUS
          rawStatus,

          status:
            statusMap[rawStatus] || "NEZNÁMÝ",

          isVisible,

          hidePrice,

          // AREAS
          area:
            Number(getAttr(flat, "flat_area")) || 0,

          livingArea:
            Number(getAttr(flat, "flat_area_living")) || 0,

          balcony,

          terrace,

          loggia,

          exteriorArea,

          garden:
            Number(getAttr(flat, "flat_area_garden")) || 0,

          // ORIENTATION
          orientation:
            getAttr(flat, "flat_orientation"),

          // PRICES
          price:
            hidePrice
              ? null
              : Number(getAttr(flat, "flat_price")) || 0,

          priceWithoutVat:
            hidePrice
              ? null
              : Number(
                  getAttr(flat, "flat_price_without_vat")
                ) || 0,

          beforeDiscountVat:
            hidePrice
              ? null
              : Number(
                  getAttr(
                    flat,
                    "flat_price_before_discount_vat"
                  )
                ) || 0,

          discountVat:
            hidePrice
              ? null
              : Number(
                  getAttr(flat, "flat_discount_vat")
                ) || 0,

          // FLOORPLAN
          floorplan: {
            id: flat.picture?.id || null,

            resource:
              flat.picture?.resource || null,
          },

          floorplanUrl:
            `${baseUrl}/floorplans/bytyPNG/${flatNumber}_1.png`,

          buildingSituationUrl:
            `${baseUrl}/floorplans/situaciePNG/${flatNumber}_2.png`,

          floorSituationUrl:
            `${baseUrl}/floorplans/situaciePNG/${flatNumber}_3.png`,

          // PDF
          pdf:
            flat.pdf || null,

          // IMAGES
          images: flat.picture
            ? [
                {
                  id: flat.picture.id,

                  resource:
                    flat.picture.resource,

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