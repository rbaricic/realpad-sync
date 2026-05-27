export async function GET() {
  return Response.json({
    projectId: process.env.REALPAD_PROJECT_ID,
    developerId: process.env.REALPAD_DEVELOPER_ID,
    screenId: process.env.REALPAD_SCREEN_ID,
  });
}