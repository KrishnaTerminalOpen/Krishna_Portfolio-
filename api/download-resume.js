import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const filePath = path.join(
    process.cwd(),
    "public",
    "resume.pdf"
  );

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: "Resume PDF not found.",
    });
  }

  const file = fs.readFileSync(filePath);

  res.setHeader("Content-Type", "application/pdf");

  res.setHeader(
    "Content-Disposition",
    'attachment; filename="Krishna-Sahu-Resume.pdf"'
  );

  res.setHeader("Content-Length", file.length);

  return res.status(200).send(file);
}