export const catalogCategories: Record<string,string> = {VENUE:'예식장',STUDIO:'스튜디오',DRESS:'드레스',MAKEUP:'메이크업',JEWELRY:'예물',HANBOK:'한복',SUIT:'예복',WEDDING_PHOTO:'본식스냅',IPHONE_SNAP:'아이폰스냅',WEDDING_VIDEO:'DVD·본식영상'};
export type CatalogData = {externalKey:string;organizationName:string;branchName:string;category:string;region:string;address:string;publicPhone:string;sourceUrl:string};
export type CatalogDraft = {id:string;data:CatalogData;status:'DRAFT'|'ARCHIVED';version:number;updatedAt:string};
export type Publication = {draftId:string;listingId:string;data:CatalogData;status:string;draftVersion:number;version:number;reviewedOn:string;updatedAt:string};
