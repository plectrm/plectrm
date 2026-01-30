# Maintainer: memrye <maevecrancher@protonmail.com>
pkgname=plectrm
pkgver=0.1.0
pkgrel=1
pkgdesc="ASCII Tab Editor"
arch=('x86_64')
url="https://github.com/plectrm/plectrm"
license=('GPL-3.0-only')
depends=()
options=('!strip')
source=("$pkgname-$pkgver.AppImage::$url/releases/download/v$pkgver/${pkgname}-${pkgver}.AppImage")
noextract=("$pkgname-$pkgver.AppImage")
sha256sums=('SKIP') 

package() {
    cd "$srcdir"
    
    install -Dm755 "$pkgname-$pkgver.AppImage" "$pkgdir/opt/$pkgname/$pkgname.AppImage"
    
    install -dm755 "$pkgdir/usr/bin"
    cat > "$pkgdir/usr/bin/$pkgname" << 'EOF'
#!/bin/sh
exec /opt/plectrm/plectrm.AppImage "$@"
EOF
    chmod 755 "$pkgdir/usr/bin/$pkgname"
    
    # create desktop file
    install -dm755 "$pkgdir/usr/share/applications"
    cat > "$pkgdir/usr/share/applications/$pkgname.desktop" << EOF
[Desktop Entry]
Name=plectrm
Comment=ASCII Tab Editor
Exec=plectrm %U
Icon=plectrm
Type=Application
Categories=Office;AudioVideo;
StartupWMClass=plectrm
EOF
    
    chmod +x "$pkgname-$pkgver.AppImage"
    if "./$pkgname-$pkgver.AppImage" --appimage-extract >/dev/null 2>&1; then
        if [ -d squashfs-root ]; then
            for size in 16 32 48 64 128 256 512; do
                icon="squashfs-root/usr/share/icons/hicolor/${size}x${size}/apps/$pkgname.png"
                if [ -f "$icon" ]; then
                    install -Dm644 "$icon" \
                        "$pkgdir/usr/share/icons/hicolor/${size}x${size}/apps/$pkgname.png"
                fi
            done
            rm -rf squashfs-root
        fi
    fi
}
