export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: GenericRelationship[];
};

type GenericView = {
  Row: Record<string, unknown>;
  Relationships: GenericRelationship[];
};

type GenericFunction = {
  Args: Record<string, unknown> | never;
  Returns: unknown;
};

export interface Database {
  public: {
    Tables: Record<string, GenericTable> & {
      tasks: {
        Row: {
          id: string;
          date: string;
          week: number;
          day: number;
          type: string;
          title: string;
          description: string | null;
          difficulty: "easy" | "medium" | "hard" | null;
          resource_url: string | null;
          hint: string | null;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["tasks"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: GenericRelationship[];
      };
      daily_reviews: {
        Row: {
          id: string;
          date: string;
          content: string | null;
          problems: string | null;
          tomorrow_plan: string | null;
          mood: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["daily_reviews"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["daily_reviews"]["Insert"]
        >;
        Relationships: GenericRelationship[];
      };
      note_links: {
        Row: {
          id: string;
          task_id: string;
          title: string;
          url: string;
          platform: "yuque" | "notion" | "feishu" | "other";
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["note_links"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["note_links"]["Insert"]>;
        Relationships: GenericRelationship[];
      };
      task_resources: {
        Row: {
          id: string;
          task_id: string;
          title: string;
          url: string;
          type: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["task_resources"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["task_resources"]["Insert"]
        >;
        Relationships: GenericRelationship[];
      };
      extra_learnings: {
        Row: {
          id: string;
          date: string;
          title: string;
          category: string;
          duration: number;
          resource_url: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["extra_learnings"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["extra_learnings"]["Insert"]
        >;
        Relationships: GenericRelationship[];
      };
      milestones: {
        Row: {
          id: string;
          week: number;
          title: string;
          description: string | null;
          target_date: string;
          completed: boolean;
          completed_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["milestones"]["Row"],
          "id"
        > & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["milestones"]["Insert"]>;
        Relationships: GenericRelationship[];
      };
    };
    Views: Record<string, GenericView>;
    Functions: Record<string, GenericFunction>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, Record<string, unknown>>;
  };
}

// 导出常用类型
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type DailyReview = Database["public"]["Tables"]["daily_reviews"]["Row"];
export type NoteLink = Database["public"]["Tables"]["note_links"]["Row"];
export type TaskResource =
  Database["public"]["Tables"]["task_resources"]["Row"];
export type ExtraLearning =
  Database["public"]["Tables"]["extra_learnings"]["Row"];
export type Milestone = Database["public"]["Tables"]["milestones"]["Row"];
