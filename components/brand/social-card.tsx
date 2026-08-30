import { RiftClashMark } from "@/components/brand/rift-clash-logo";
import { siteConfig } from "@/lib/site";

export function SocialCard() {
  return (
    <div
      style={{
        alignItems: "center",
        background: "#070B18",
        color: "#F4F6FF",
        display: "flex",
        height: "100%",
        padding: "72px 82px",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          background: "#11182C",
          border: "2px solid #263555",
          borderRadius: 40,
          bottom: 36,
          display: "flex",
          left: 36,
          position: "absolute",
          right: 36,
          top: 36,
        }}
      />
      <RiftClashMark
        style={{
          flexShrink: 0,
          height: 270,
          position: "relative",
          width: 270,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginLeft: 70,
          position: "relative",
        }}
      >
        <div
          style={{
            background: "#873BFF",
            borderRadius: 4,
            display: "flex",
            height: 8,
            marginBottom: 26,
            width: 82,
          }}
        />
        <div
          style={{
            color: "#F4F6FF",
            display: "flex",
            fontSize: 76,
            fontWeight: 800,
            letterSpacing: 8,
            lineHeight: 1,
          }}
        >
          RIFT
        </div>
        <div
          style={{
            color: "#FFD21E",
            display: "flex",
            fontSize: 76,
            fontWeight: 800,
            letterSpacing: 8,
            lineHeight: 1.08,
          }}
        >
          CLASH
        </div>
        <div
          style={{
            color: "#8E99B6",
            display: "flex",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 4,
            marginTop: 16,
          }}
        >
          FRIENDS TOURNAMENT
        </div>
        <div
          style={{
            color: "#B4BED6",
            display: "flex",
            fontSize: 24,
            lineHeight: 1.35,
            marginTop: 30,
            maxWidth: 600,
          }}
        >
          {siteConfig.description}
        </div>
      </div>
    </div>
  );
}
