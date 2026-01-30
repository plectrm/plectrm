# Maintainer: memrye <maevecrancher@protonmail.com>
pkgname=plectrm
pkgver=0.1.1
pkgrel=1
pkgdesc="ASCII Tab Editor"
arch=('x86_64')
url="https://github.com/plectrm/plectrm"
license=('GPL-3.0-only')
depends=('electron')
options=('!strip')
source=("$pkgname-$pkgver.AppImage::$url/releases/download/v$pkgver/${pkgname}-${pkgver}.AppImage"
        "$pkgname.desktop"
        "$pkgname.sh")
noextract=("$pkgname-$pkgver.AppImage")

package() {
    install -Dm755 "$srcdir/$pkgname-$pkgver.AppImage" "$pkgdir/opt/$pkgname/$pkgname.AppImage"
    
    install -Dm755 "$srcdir/$pkgname.sh" "$pkgdir/usr/bin/$pkgname"
    
    install -Dm644 "$srcdir/$pkgname.desktop" "$pkgdir/usr/share/applications/$pkgname.desktop"
    
    cd "$srcdir"
    chmod +x "$pkgname-$pkgver.AppImage"
    "./$pkgname-$pkgver.AppImage" --appimage-extract >/dev/null 2>&1 || true
    
    if [ -d squashfs-root ]; then
        # install icons
        for size in 16 32 48 64 128 256 512; do
            if [ -f "squashfs-root/usr/share/icons/hicolor/${size}x${size}/apps/$pkgname.png" ]; then
                install -Dm644 "squashfs-root/usr/share/icons/hicolor/${size}x${size}/apps/$pkgname.png" \
                    "$pkgdir/usr/share/icons/hicolor/${size}x${size}/apps/$pkgname.png"
            fi
        done
        rm -rf squashfs-root
    fi
}

sha256sums=('SKIP' 'SKIP' 'SKIP')
