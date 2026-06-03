const WEBFLOW_TOKEN = process.env.WEBFLOW_TOKEN!;
const COLLECTION_ID = process.env.WEBFLOW_COLLECTION_ID!;

const headers = {
  Authorization: `Bearer ${WEBFLOW_TOKEN}`,
  "Content-Type": "application/json",
};

export async function GET() {
  try {
    // LOAD REALPAD DATA
    const response = await fetch(
      "https://realpad-sync.vercel.app/api/realpad"
    );

    const flats = await response.json();

    // LOAD WEBFLOW ITEMS
    const existingResponse = await fetch(
      `https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`,
      {
        headers,
      }
    );

    const existingData = await existingResponse.json();

    const existingItems = existingData.items || [];

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const flat of flats) {

      // SKIP HIDDEN FLATS
      if (!flat.isVisible) {
        skipped++;
        continue;
      }

      const existingItem = existingItems.find(
        (item: any) =>
          item.fieldData?.["flat-id"] === flat.id
      );

      const fieldData = {
        name: flat.number || "byt",

        slug: (flat.number || "byt")
          .toLowerCase()
          .replace(/\./g, "-")
          .replace(/\s+/g, "-"),

        // IDs
        "flat-id": flat.id || "",
        number: flat.number || "",

        // BASIC
        title: flat.title || "",
        disposition: flat.disposition || "",
        status: flat.status || "",

        // LOCATION
        floor: flat.floor || 0,
        building: flat.building || "",

        // PRICE
        price: flat.price || 0,
        "price-without-vat": flat.priceWithoutVat || 0,
        "before-discount-vat": flat.beforeDiscountVat || 0,
        "discount-vat": flat.discountVat || 0,

        // FLAGS
        "hide-price": flat.hidePrice || false,

        // AREAS
        area: flat.area || 0,
        "living-area": flat.livingArea || 0,
        balcony: flat.balcony || 0,
        terrace: flat.terrace || 0,
        loggia: flat.loggia || 0,
        garden: flat.garden || 0,
        "exterior-area": flat.exteriorArea || 0,

        // DETAILS
        orientation: flat.orientation || "",
        type: flat.type || "",
        category: flat.category || "",

        // PDF
        pdf: flat.pdf || "",

        // FLOORPLAN
        "floorplan-resource":
          flat.floorplan?.resource || "",

        "floorplan-id":
          flat.floorplan?.id || "",

        // IMAGES
        "floorplan-url":
          flat.floorplanUrl || "",

        "building-situation-url":
          flat.buildingSituationUrl || "",

        "floor-situation-url":
          flat.floorSituationUrl || "",

        "images-json":
          JSON.stringify(flat.images || []),
      };

      // UPDATE
      if (existingItem) {

        await fetch(
          `https://api.webflow.com/v2/collections/${COLLECTION_ID}/items/${existingItem.id}`,
          {
            method: "PATCH",
            headers,

            body: JSON.stringify({
              isArchived: false,
              isDraft: false,
              fieldData,
            }),
          }
        );

        updated++;
      }

      // CREATE
      else {

        await fetch(
          `https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`,
          {
            method: "POST",
            headers,

            body: JSON.stringify({
              isArchived: false,
              isDraft: false,
              fieldData,
            }),
          }
        );

        created++;
      }
    }

    return Response.json({
      success: true,
      total: flats.length,
      created,
      updated,
      skipped,
    });

  } catch (error) {

    return Response.json({
      success: false,
      error,
    });
  }
}