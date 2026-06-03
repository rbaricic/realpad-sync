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

      // TEST ONLY FLAT PRICE
      const fieldData = {

        name: flat.number || "byt",

        slug: (flat.number || "byt")
          .toLowerCase()
          .replace(/\./g, "-")
          .replace(/\s+/g, "-"),

        "flat-id": flat.id || "",

        "flat-price": Number(flat.price || 0),
      };

      console.log("FIELD DATA:");
      console.log(fieldData);

      // UPDATE
      if (existingItem) {

        const updateResponse = await fetch(
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

        const updateText =
          await updateResponse.text();

        console.log("UPDATE RESPONSE:");
        console.log(updateText);

        updated++;
      }

      // CREATE
      else {

        const createResponse = await fetch(
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

        const createText =
          await createResponse.text();

        console.log("CREATE RESPONSE:");
        console.log(createText);

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

    console.log("SYNC ERROR:");
    console.log(error);

    return Response.json({
      success: false,
      error,
    });
  }
}