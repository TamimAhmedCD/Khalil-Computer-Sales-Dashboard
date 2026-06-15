export async function GET() {
  try {
    return Response.json({ success: true, data: "Hello World" });
  } catch (error) {
    return Response.json({ success: false, message: "Failed to fetch data" });
  }
}
export async function POST() {
  try {
    const data = await request.json();
    console.log(data);
    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json({ success: false, message: "Failed to add product" });
  }
}
