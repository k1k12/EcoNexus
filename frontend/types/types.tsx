import { ReactNode } from "react";

export type UserRole = "GUEST" | "USER" | "ADMIN" | "COUNCIL";

export const Days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export type RecyclingPoint = {
    id: number;
    longitude: number;
    latitude: number;
    postCode: string | null; // only new recycling points can have no postcode
    type: Material[];
    description: string | null; // description is optional for any recycling point, dnm new or not
    timetable: TimeInterval[];
    isNew?: boolean; // only those points which have been created but not yet commited to the backend will have this flag set to true
}

export type Material = {
    id: number;
    name: string;
}

export type ScannedItem = {
    barcode: string;
    name: string;
    material: Material;
    recyclable: boolean;
}

export type UserDashboardBarchartData = {
    bardata: {
      value: number;
      label: string;
      frontColor: string;
      topLabelComponent: ReactNode;
      disablePress: boolean;
    };
    
};

export type UserDashboardData = {
    progress: {
        itemsPerDayOverLastWeek: {
            mon?: number;
            tue?: number;
            wed?: number;
            thu?: number;
            fri?: number;
            sat?: number;
            sun?: number;
        };
        improvementOverLastWeek: number;
        averageItemsPerWeekOverLastMonth: number;
    };
    environmentalImpact: {
        turtlesSaved: number;
        treesSaved: number;
        co2Saved: number;
    };
    statistics: {
        materialsRecycled: {
            [materialName: string]: number;
        };
    };
};

export type DashboardData = {

};

export type Point2D = {
    x: number;
    y: number;
}

export type NewRecyclingPointBackend = {
    point_id: number;
    gss_code: string;
    user_id: number;
    material_ids: number[];
    latitude: number;
    longitude: number;
    times_open: WeeklyHours;
};

// this type is used only when sending updates to the backend,
// TimeInterval[] gets converted into this
export type WeeklyHours = {
    monday: [string, string];
    tuesday: [string, string];
    wednesday: [string, string];
    thursday: [string, string];
    friday: [string, string];
    saturday: [string, string];
    sunday: [string, string];
};

export type RegisterFields = {
    firstname: string;
    surname: string;
    emailLogin: string;
    password: string;
    confirmPassword: string;
    emailRegistering: string;
    areaCode: string;
    userType: UserRole;
    mfaEnabled: boolean;
    mfaSecret: string;
    mfaCode: string;
}

export type ScanningSteps = "SCANNING" | "AFTER_SCANNED" | "MAP";


export type Response = {success: true;} | {success: false; message: string}

export type Box2D = {
    topRight: Point2D;
    topLeft: Point2D;
    bottomLeft: Point2D;
    bottomRigth: Point2D;
}

export type Changes = {
    "deleted" : number[], // ids of deleted points
    "updated" : {
        point_id: number, 
        changed_fields: any
    }[]
    "new" : NewRecyclingPointBackend[]
}


export enum LoginPages {
  HomePage = 1, //First page the user will see to log in or create an account
  CreateAccountPage = 2,
  LoginPage = 3,
  SelectArea = 4, //For council users only, page 4 and 5
  PendingApproval = 5,
}

export type Hour =
    | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | 10 | 11 | 12
    | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23;

export type Minute =
    | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | 10 | 11 | 12 | 13 | 14 | 15
    | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31
    | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47
    | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59;

export type HourMinute = {
    hour: Hour;
    minute: Minute;
};

export type TimeInterval = {
    opensAt: HourMinute;
    closesAt: HourMinute;
    openFullDay: boolean;
    closed: boolean;
};
