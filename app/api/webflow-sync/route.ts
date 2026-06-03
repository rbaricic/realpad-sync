const WEBFLOW_TOKEN = process.env.WEBFLOW_TOKEN!;
const COLLECTION_ID = process.env.WEBFLOW_COLLECTION_ID!;

const headers = {
  Authorization: `Bearer ${WEBFLOW_TOKEN}`,
  "Content-Type": "application/json",
};

// FORMAT PRICE
const formatPrice = (value: any) => {
  if (!value) return "";

  return Number(value).toLocaleString("cs-CZ");
};

export async function GET() {
  try {
    // LOAD REALPAD FLATS
    const response = await fetch(
      "https://realpad-sync.vercel.app/api/realpad"
    );

    const flats = await response.json();

    // LOAD EXISTING WEBFLOW ITEMS
    const existingResponse = await fetch(
      `https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`,
      {
        headers,
      }
    );

    const existingData = await existingResponse.json();

    const existingItems = existingData.items || [];

    console.log("WEBFLOW EXISTING ITEM:");
    console.log(existingItems[0]?.fieldData);

    let created = 0;
    let updated = 0;

    for (const flat of flats) {
      const existingItem = existingItems.find(
        (item: any) =>
          item.fieldData?.["flat-id"] === flat.id
      );

      const fieldData = {
        name: flat.number,
        slug: flat.number.toLowerCase().replace(/\./g, "-"),

        "flat-id": flat.id,

        number: flat.number,
        title: flat.title,
        status: flat.status,

        floor: flat.floor,

        // FORMATTED PRICES
        price: flat.price,

        "price-without-vat":
          formatPrice(flat.priceWithoutVat),

        "before-discount-vat":
          formatPrice(flat.beforeDiscountVat),

        "discount-vat":
          formatPrice(flat.discountVat),

        area: flat.area,

        "living-area": flat.livingArea,

        balcony: flat.balcony,

        terrace: flat.terrace,

        loggia: flat.loggia,

        garden: flat.garden,

        orientation: flat.orientation,

        type: flat.type,

        category: flat.category,

        pdf: flat.pdf,

        "floorplan-resource":
          flat.floorplan?.resource || "",

        "floorplan-id":
          flat.floorplan?.id || "",

        "images-json": JSON.stringify(
          flat.images || []
        ),
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

        const updateData =
          await updateResponse.json();

        console.log("UPDATE RESPONSE:");
        console.log(updateData);

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

        const createData =
          await createResponse.json();

        console.log("CREATE RESPONSE:");
        console.log(createData);

        created++;
      }
    }

    return Response.json({
      success: true,
      total: flats.length,
      created,
      updated,
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

//TEST