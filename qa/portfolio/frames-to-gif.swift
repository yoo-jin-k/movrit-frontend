// 녹화 프레임(record-demo.mjs 결과) 한 장면을 README에서 바로 재생되는 GIF로 만듭니다. macOS 기본 기능(ImageIO)만 씁니다.
// 실행: swift qa/portfolio/frames-to-gif.swift <결과.gif> <장면 폴더> [가로 픽셀=720] [배속=1.5]
// GitHub README는 mp4를 화면 안에서 재생하지 않으므로, 장면별 GIF를 작게 만들어 함께 올립니다.
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let arguments = CommandLine.arguments
guard arguments.count >= 3 else {
  print("사용법: swift frames-to-gif.swift <결과.gif> <장면 폴더> [가로 픽셀] [배속]")
  exit(1)
}
let output = URL(fileURLWithPath: arguments[1])
let scene = URL(fileURLWithPath: arguments[2], isDirectory: true)
let targetWidth = arguments.count > 3 ? Int(arguments[3]) ?? 720 : 720
let speed = arguments.count > 4 ? Double(arguments[4]) ?? 1.5 : 1.5
// GIF가 너무 커지지 않도록 프레임 사이 간격을 이 값(초) 이상으로 묶습니다.
let minimumGap = 0.2

/// frames.txt에서 (파일, 유지 시간) 목록을 읽습니다. 마지막 반복 줄(시간 없음)은 건너뜁니다.
func frameList(_ scene: URL) throws -> [(URL, Double)] {
  let text = try String(contentsOf: scene.appendingPathComponent("frames.txt"), encoding: .utf8)
  var list: [(URL, Double)] = []
  var current: URL?
  for line in text.split(separator: "\n") {
    if line.hasPrefix("file '") {
      current = scene.appendingPathComponent(String(line.dropFirst(6).dropLast()))
    } else if line.hasPrefix("duration "), let file = current,
      let seconds = Double(line.dropFirst(9))
    {
      list.append((file, seconds))
      current = nil
    }
  }
  return list
}

// 짧은 프레임은 다음 프레임에 시간을 넘겨 묶고, 배속을 적용합니다.
var frames: [(URL, Double)] = []
var carried = 0.0
for (file, seconds) in try frameList(scene) {
  let total = carried + seconds
  if total < minimumGap { carried = total; continue }
  frames.append((file, total / speed))
  carried = 0
}
if carried > 0, let last = frames.popLast() { frames.append((last.0, last.1 + carried / speed)) }
guard !frames.isEmpty else {
  print("프레임을 찾지 못했습니다.")
  exit(1)
}

func scaled(_ url: URL) -> CGImage? {
  guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
    let picture = CGImageSourceCreateImageAtIndex(source, 0, nil)
  else { return nil }
  let height = picture.height * targetWidth / picture.width
  guard
    let context = CGContext(
      data: nil, width: targetWidth, height: height, bitsPerComponent: 8, bytesPerRow: 0,
      space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)
  else { return nil }
  context.interpolationQuality = .high
  context.draw(picture, in: CGRect(x: 0, y: 0, width: targetWidth, height: height))
  return context.makeImage()
}

try? FileManager.default.removeItem(at: output)
guard
  let destination = CGImageDestinationCreateWithURL(
    output as CFURL, UTType.gif.identifier as CFString, frames.count, nil)
else {
  print("GIF 파일을 만들지 못했습니다.")
  exit(1)
}
CGImageDestinationSetProperties(
  destination,
  [kCGImagePropertyGIFDictionary: [kCGImagePropertyGIFLoopCount: 0]] as CFDictionary)
var elapsed = 0.0
for (file, seconds) in frames {
  guard let picture = scaled(file) else { continue }
  CGImageDestinationAddImage(
    destination, picture,
    [
      kCGImagePropertyGIFDictionary: [
        kCGImagePropertyGIFDelayTime: seconds, kCGImagePropertyGIFUnclampedDelayTime: seconds,
      ]
    ] as CFDictionary)
  elapsed += seconds
}
guard CGImageDestinationFinalize(destination) else {
  print("GIF 변환 실패")
  exit(1)
}
print(String(format: "완료: %@ (%d프레임, %.1f초)", output.path, frames.count, elapsed))
