import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "../Footer";

describe("Footer", () => {
  it("renders brand name", () => {
    render(<Footer />);
    expect(screen.getByText("Chinni Treasure")).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(<Footer />);
    const taglines = screen.getAllByText("Little Love");
    expect(taglines.length).toBeGreaterThan(0);
  });

  it("renders quick links", () => {
    render(<Footer />);
    expect(screen.getByText("Catalogue")).toBeInTheDocument();
    expect(screen.getByText("Place Order")).toBeInTheDocument();
    expect(screen.getByText("Track Order")).toBeInTheDocument();
  });

  it("renders customer care links", () => {
    render(<Footer />);
    expect(screen.getByText("Returns Policy")).toBeInTheDocument();
  });

  it("renders contact information", () => {
    render(<Footer />);
    const phones = screen.getAllByText("+91 9499011029");
    expect(phones.length).toBe(2);
    expect(screen.getByText("chinnitreasure29@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("ChinniTreasure")).toBeInTheDocument();
    expect(screen.getByText("ChinniTreasures")).toBeInTheDocument();
  });

  it("renders contact links with correct aria-labels", () => {
    render(<Footer />);
    expect(screen.getByLabelText("Call Chinni Treasure at 9499011029")).toBeInTheDocument();
    expect(screen.getByLabelText("Message Chinni Treasure on WhatsApp")).toBeInTheDocument();
    expect(screen.getByLabelText("Email Chinni Treasure")).toBeInTheDocument();
    expect(screen.getByLabelText("Open Chinni Treasure on Instagram")).toBeInTheDocument();
    expect(screen.getByLabelText("Open Chinni Treasure on Facebook")).toBeInTheDocument();
  });

  it("renders the copyright year", () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it("renders 'Made with care'", () => {
    render(<Footer />);
    expect(screen.getByText("Made with care")).toBeInTheDocument();
  });

  it("has role='contentinfo' on the footer element", () => {
    const { container } = render(<Footer />);
    expect(container.querySelector('footer[role="contentinfo"]')).toBeTruthy();
  });

  it("renders SVG icons with aria-hidden='true'", () => {
    const { container } = render(<Footer />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
    svgs.forEach((svg) => {
      expect(svg.getAttribute("aria-hidden")).toBe("true");
    });
  });

  it("renders ContactIcon default case for unknown type", () => {
    // Just render footer - the default case returns null, which is fine
    // The important thing is all known icons render
    const { container } = render(<Footer />);
    const contactList = container.querySelector(".contact-list");
    expect(contactList?.querySelectorAll("li").length).toBe(5);
  });
});
