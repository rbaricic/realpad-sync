const WEBFLOW_TOKEN = process.env.WEBFLOW_TOKEN!;
const COLLECTION_ID = process.env.WEBFLOW_COLLECTION_ID!;

export async function GET() {
  try {
    const response = await fetch(
      "https://realpad-sync.vercel.app/api/realpad"
    );

    const flats = await response.json();

    for (const flat of flats) {
      await fetch(
        `https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WEBFLOW_TOKEN}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            isArchived: false,
            isDraft: false,

            fieldData: {
              name: flat.number,
              slug: flat.number.toLowerCase().replace(/\./g, "-"),

              "flat-id": flat.id,
              number: flat.number,
              title: flat.title,
              status: flat.status,

              floor: flat.floor,

              price: flat.price,
              "price-without-vat": flat.priceWithoutVat,
              "before-discount-vat": flat.beforeDiscountVat,
              "discount-vat": flat.discountVat,

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

              "floorplan-resource": flat.floorplan?.resource,
              "floorplan-id": flat.floorplan?.id,

              "images-json": JSON.stringify(flat.images || []),
            },
          }),
        }
      );
    }

    return Response.json({
      success: true,
      count: flats.length,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error,
    });
  }
}