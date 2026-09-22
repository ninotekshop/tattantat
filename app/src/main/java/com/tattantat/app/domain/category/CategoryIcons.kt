package com.tattantat.app.domain.category

import androidx.annotation.DrawableRes
import com.tattantat.app.R

object CategoryIcons {
    /**
     * Resolves the 3D drawable icon resource for a category ID or slug.
     */
    @DrawableRes
    fun getDrawableRes(categoryIdOrSlug: String): Int {
        val slug = categoryIdOrSlug.lowercase().trim().replace("_", "-")
        return when (slug) {
            "nha-dat", "property", "can-ho-chung-cu", "nha-o", "dat", "phong-tro", "van-phong", "mat-bang-kinh-doanh", "kho-xuang", "bds-khac" -> R.drawable.cat_nha_dat
            "xe-co", "vehicle", "vehicles", "o-to", "xe-may", "xe-dap", "xe-tai-chuyen-dung", "phu-tung-phu-kien-xe", "phuong-tien-khac" -> R.drawable.cat_xe_co
            "do-cong-nghe", "phones", "tech", "technology", "dien-thoai", "may-tinh-bang", "laptop", "may-tinh-de-ban", "may-anh-may-quay", "tv-am-thanh", "thiet-bi-choi-game", "thiet-bi-deo-thong-minh", "phu-kien-tech", "linh-kien-tech" -> R.drawable.cat_do_cong_nghe
            "nha-cua-doi-song", "home", "dien-lanh", "bep-dien-nha-bep", "dung-cu-nha-bep", "noi-that", "giuong-nem", "thiet-bi-ve-sinh-nha-tam", "quat-thiet-bi-khong-khi", "den-chieu-sang", "trang-tri-nha-cua", "cay-canh-san-vuon", "do-gia-dung-khac" -> R.drawable.cat_nha_cua_doi_song
            "thoi-trang-ca-nhan", "fashion", "quan-ao-nam", "quan-ao-nu", "giay-dep", "tui-xach-balo-vali", "dong-ho", "trang-suc", "nuoc-hoa", "my-pham", "phu-kien-thoi-trang" -> R.drawable.cat_thoi_trang_ca_nhan
            "me-va-be", "mother-baby", "mother_baby", "do-cho-be", "do-cho-me", "xe-day-ghe-noi-cui", "do-choi-tre-em", "quan-ao-tre-em", "sua-do-an-cho-be", "me-be-khac" -> R.drawable.cat_me_va_be
            "the-thao-giai-tri", "sports", "the-thao", "da-ngoai", "nhac-cu", "sach-truyen-tap-chi", "do-suu-tam", "game-phu-kien", "ve-xem-phim-sukiens", "so-thich-khac" -> R.drawable.cat_the_thao_giai_tri
            "thu-cung", "pets", "cho", "meo", "chim", "ca-canh", "thu-cung-khac", "thuc-an-thu-cung", "phu-kien-thu-cung", "dich-vu-thu-cung" -> R.drawable.cat_thu_cung
            "viec-lam", "jobs", "ban-hang-viec", "kinh-doanh-viec", "van-phong-viec", "ke-toan-viec", "it-cong-nghe-viec", "marketing-viec", "thiet-ke-viec", "nha-hang-khach-san-viec", "giao-hang-tai-xe-viec", "lao-dong-pho-thong-viec", "ky-thuat-viec", "viec-lam-khac" -> R.drawable.cat_viec_lam
            "dich-vu", "services", "sua-chua-dich-vu", "van-chuyen-dich-vu", "thue-xe-dich-vu", "du-lich-dich-vu", "luu-tru-dich-vu", "gia-dinh-dich-vu", "ve-sinh-dich-vu", "lam-dep-dich-vu", "chup-anh-video-dich-vu", "thiet-ke-cong-nghe-dich-vu", "giao-duc-dich-vu", "to-chuc-su-kien-dich-vu", "dich-vu-khac" -> R.drawable.cat_dich_vu
            "thuc-pham", "food", "do-an", "do-uong", "dac-san", "rau-cu-trai-cay", "thuc-pham-tuoi-song", "thuc-pham-kho", "do-handmade", "thuc-pham-khac" -> R.drawable.cat_thuc_pham
            "may-moc-cong-nghiep", "machinery", "may-moc-nong-nghiep", "thiet-bi-xay-dung", "dung-cu-co-khi", "thiet-bi-nha-hang", "thiet-bi-cua-hang", "thiet-bi-van-phong", "nguyen-vat-lieu", "giong-cay-trong", "may-moc-khac" -> R.drawable.cat_may_moc_cong_nghiep
            "tang-mien-phi", "giveaway", "free", "do-gia-dung-tang", "sach-quan-ao-tang", "thu-cung-cho-nuoi" -> R.drawable.cat_tang_mien_phi
            else -> R.drawable.cat_khac
        }
    }
}
