// 녹화 프레임(record-demo.mjs 결과)을 H.264 mp4 하나로 이어 붙입니다. ffmpeg 없이 macOS 기본 기능(AVFoundation)만 씁니다.
// 실행: swift qa/portfolio/frames-to-mp4.swift <결과.mp4> <장면 폴더> [<장면 폴더> ...]
// 장면 폴더마다 frames.txt(파일 이름과 화면 유지 시간)를 읽어 그 시간만큼 프레임을 보여 줍니다.
import AVFoundation
import CoreGraphics
import Foundation
import ImageIO

let arguments = CommandLine.arguments
guard arguments.count >= 3 else {
  print("사용법: swift frames-to-mp4.swift <결과.mp4> <장면 폴더>...")
  exit(1)
}
let output = URL(fileURLWithPath: arguments[1])
let scenes = arguments.dropFirst(2).map { URL(fileURLWithPath: $0, isDirectory: true) }

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

func image(_ url: URL) -> CGImage? {
  guard let source = CGImageSourceCreateWithURL(url as CFURL, nil) else { return nil }
  return CGImageSourceCreateImageAtIndex(source, 0, nil)
}

let all = try scenes.flatMap(frameList)
guard let first = all.first.flatMap({ image($0.0) }) else {
  print("프레임을 찾지 못했습니다.")
  exit(1)
}
let width = first.width - first.width % 2
let height = first.height - first.height % 2

try? FileManager.default.removeItem(at: output)
let writer = try AVAssetWriter(outputURL: output, fileType: .mp4)
let input = AVAssetWriterInput(
  mediaType: .video,
  outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
    AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 2_500_000],
  ])
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(
  assetWriterInput: input,
  sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
    kCVPixelBufferWidthKey as String: width,
    kCVPixelBufferHeightKey as String: height,
  ])
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

let timescale: CMTimeScale = 600
var elapsed = 0.0
var written = 0
for (file, seconds) in all {
  // 아주 짧은 프레임(화면 전환 중 순간 프레임)은 시간만 더하고 건너뜁니다.
  if seconds < 0.02 { elapsed += seconds; continue }
  guard let picture = image(file), let pool = adaptor.pixelBufferPool else { continue }
  var buffer: CVPixelBuffer?
  CVPixelBufferPoolCreatePixelBuffer(nil, pool, &buffer)
  guard let pixels = buffer else { continue }
  CVPixelBufferLockBaseAddress(pixels, [])
  let context = CGContext(
    data: CVPixelBufferGetBaseAddress(pixels), width: width, height: height,
    bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(pixels),
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue)
  context?.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
  context?.fill(CGRect(x: 0, y: 0, width: width, height: height))
  context?.draw(picture, in: CGRect(x: 0, y: 0, width: picture.width, height: picture.height)
    .offsetBy(dx: 0, dy: CGFloat(height - picture.height)))
  CVPixelBufferUnlockBaseAddress(pixels, [])
  while !input.isReadyForMoreMediaData { usleep(2000) }
  adaptor.append(pixels, withPresentationTime: CMTime(seconds: elapsed, preferredTimescale: timescale))
  elapsed += seconds
  written += 1
}
input.markAsFinished()
writer.endSession(atSourceTime: CMTime(seconds: elapsed, preferredTimescale: timescale))
let done = DispatchSemaphore(value: 0)
writer.finishWriting { done.signal() }
done.wait()
if writer.status != .completed {
  print("변환 실패: \(writer.error?.localizedDescription ?? "알 수 없음")")
  exit(1)
}
print(String(format: "완료: %@ (%d프레임, %.1f초)", output.path, written, elapsed))
