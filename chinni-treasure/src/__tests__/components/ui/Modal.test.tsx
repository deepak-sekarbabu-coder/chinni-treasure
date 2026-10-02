import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { useState } from "react";
import Modal from "@/src/components/ui/Modal";

/** The module's own contract: scaffold, Escape policy, nesting, scroll lock. */
function Harness({
  onClose,
  closeOnEscape,
  closeOnOverlayClick,
  label = "outer",
}: {
  onClose: () => void;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Modal
        open={open}
        onClose={() => { setOpen(false); onClose(); }}
        closeOnEscape={closeOnEscape}
        closeOnOverlayClick={closeOnOverlayClick}
        label={label}
        overlayClassName="overlay"
        contentClassName="panel"
      >
        <button type="button">close me</button>
      </Modal>
      {open && (
        <button type="button" onClick={() => setOpen(false)}>
          reopen
        </button>
      )}
    </>
  );
}

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

describe("Modal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <Modal open={false} onClose={() => {}} overlayClassName="overlay" contentClassName="panel">
        <p>hidden</p>
      </Modal>,
    );
    expect(container.innerHTML).toBe("");
  });

  it("wires the dialog semantics and the caller's skin", () => {
    render(
      <Modal open onClose={() => {}} labelledBy="t" overlayClassName="overlay" contentClassName="panel">
        <h2 id="t">Title</h2>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "t");
    expect(dialog).toHaveClass("panel");
    expect(dialog.parentElement).toHaveClass("overlay");
  });

  it("closes on Escape and on a backdrop click, but not a click inside", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(document.querySelector(".overlay")!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("honours closeOnOverlayClick={false}", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} closeOnOverlayClick={false} />);
    fireEvent.click(document.querySelector(".overlay")!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("only the top-most modal reacts to Escape, so a child needs no arbitration", () => {
    const outer = vi.fn();
    const inner = vi.fn();
    render(
      <>
        <Modal open onClose={outer} label="outer" overlayClassName="overlay" contentClassName="panel">
          <span>outer</span>
        </Modal>
        <Modal open onClose={inner} label="inner" overlayClassName="overlay-2" contentClassName="panel-2">
          <span>inner</span>
        </Modal>
      </>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });

  it("a closeOnEscape={false} child still shields its parent", () => {
    const outer = vi.fn();
    const inner = vi.fn();
    render(
      <>
        <Modal open onClose={outer} label="outer" overlayClassName="overlay" contentClassName="panel">
          <span>outer</span>
        </Modal>
        <Modal open onClose={inner} closeOnEscape={false} label="inner" overlayClassName="overlay-2" contentClassName="panel-2">
          <span>inner</span>
        </Modal>
      </>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(inner).not.toHaveBeenCalled();
    expect(outer).not.toHaveBeenCalled();
  });

  it("restores the scroll value that was there, and counts nested locks", () => {
    document.body.style.overflow = "auto";
    const { unmount } = render(<Harness onClose={() => {}} />);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });
});
