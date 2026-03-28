// ─── Shared types for all stamp components ───

export type InkFilter = "none" | "light" | "medium" | "heavy";
export type FadeStyle = "none" | "center" | "topleft" | "corner";

export interface StampBaseProps {
  filter?: InkFilter;
  fade?: FadeStyle;
  rotation?: number;
}

export interface StampRectEntryProps extends StampBaseProps {
  color?: string;
  country?: string;
  airport?: string;
  date?: string;
  stayDays?: number;
  visaClass?: string;
  officerCode?: string;
}

export interface StampRoundProps extends StampBaseProps {
  color?: string;
  country?: string;
  countryNative?: string;
  portNative?: string;
  port?: string;
  date?: string;
  type?: string;
}

export interface StampOvalProps extends StampBaseProps {
  color?: string;
  country?: string;
  city?: string;
  airport?: string;
  code?: string;
  date?: string;
  gate?: string;
}

export interface StampDepartureProps extends StampBaseProps {
  color?: string;
  country?: string;
  countryNative?: string;
  airport?: string;
  date?: string;
  code?: string;
  officerBadge?: string;
}

export interface StampVisitPassProps extends StampBaseProps {
  color?: string;
  country?: string;
  refNo?: string;
  date?: string;
  until?: string;
}

export interface StampVietnamProps extends StampBaseProps {
  color?: string;
  port?: string;
  portCode?: string;
  date?: string;
  type?: string;
}

export type StampType = "rectEntry" | "round" | "oval" | "departure" | "visitPass" | "vietnam";

export interface StampRegistryEntry {
  component: React.ComponentType<Record<string, unknown>>;
  label: string;
  aspect: string;
}
