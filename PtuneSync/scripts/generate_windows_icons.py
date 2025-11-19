import os
from PIL import Image

# ==== 設定 ====
# Flutter アプリの元アイコン
SRC_ICON = r"C:\home\pkm\skel\task\ptune\assets\branding\icon.png"

# WinUI アプリの Assets ディレクトリ
DEST_DIR = r"C:\home\pkm\skel\task\win\PtuneSyncBasic\PtuneSyncBasic\Assets"

# 生成する Windows 用ロゴセット
LOGO_SPECS = [
    ("Square44x44Logo.scale-200.png", 44),
    ("Square150x150Logo.scale-200.png", 150),
    ("Wide310x150Logo.scale-200.png", (310, 150)),
    ("LockScreenLogo.scale-200.png", 24),
    ("StoreLogo.png", 50),
    ("SplashScreen.scale-200.png", 620),
    ("Square44x44Logo.targetsize-24_altform-unplated.png", 24),  # ← 追加
]

# ==== 処理 ====
def resize_icon(src_path, dest_path, size, enhance=False):
    img = Image.open(src_path).convert("RGBA")
    if isinstance(size, tuple):
        img_resized = img.resize(size, Image.LANCZOS)
    else:
        img_resized = img.resize((size, size), Image.LANCZOS)

    if enhance:
        from PIL import ImageEnhance
        enhancer = ImageEnhance.Brightness(img_resized)
        img_resized = enhancer.enhance(1.15)  # 小型化で暗くならないよう補正

    img_resized.save(dest_path, "PNG")
    print(f"  created: {os.path.basename(dest_path)} ({size})")

# 呼び出し側
for filename, size in LOGO_SPECS:
    enhance = "targetsize-24" in filename
    resize_icon(SRC_ICON, os.path.join(DEST_DIR, filename), size, enhance)
    
def main():
    if not os.path.exists(SRC_ICON):
        raise FileNotFoundError(SRC_ICON)
    os.makedirs(DEST_DIR, exist_ok=True)

    print(f"Generating icons from: {SRC_ICON}")
    for filename, size in LOGO_SPECS:
        dest = os.path.join(DEST_DIR, filename)
        resize_icon(SRC_ICON, dest, size)

    # ICOも生成（高解像度含む）
    ico_path = os.path.join(DEST_DIR, "Icon.ico")
    img = Image.open(SRC_ICON).convert("RGBA")
    img.save(ico_path, format="ICO", sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])
    print(f"  created: {os.path.basename(ico_path)}")

if __name__ == "__main__":
    main()
