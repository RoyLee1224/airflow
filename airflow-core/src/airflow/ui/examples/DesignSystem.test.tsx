/*!
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * 範例：設計系統驗證測試
 *
 * 展示如何驗證設計系統的一致性，包括：
 * - 設計 tokens（顏色、間距、字體等）
 * - UI 元件變體
 * - 主題系統
 * - 無障礙性
 */

import { render } from "@testing-library/react";
import { expect, describe, it } from "vitest";
import { Button, Badge, Card, Tag, Box, Heading, Text } from "@chakra-ui/react";
import { defaultSystem } from "@chakra-ui/react";
import { ChakraWrapper } from "../src/utils/ChakraWrapper";

describe("Design System - Tokens Validation", () => {
  describe("顏色系統", () => {
    it("應該定義所有主要顏色", () => {
      const requiredColors = [
        "gray",
        "red",
        "orange",
        "yellow",
        "green",
        "teal",
        "blue",
        "cyan",
        "purple",
        "pink",
      ];

      requiredColors.forEach((color) => {
        // 檢查顏色是否存在於設計系統中
        expect(defaultSystem.theme.tokens.colors).toHaveProperty(color);
      });
    });

    it("應該匹配顏色系統快照", () => {
      // 捕獲整個顏色系統的結構
      expect(defaultSystem.theme.tokens.colors).toMatchSnapshot("design-colors");
    });

    it("應該定義語義化顏色", () => {
      const semanticColors = [
        "bg",
        "fg",
        "border",
      ];

      semanticColors.forEach((color) => {
        expect(defaultSystem.theme.tokens.colors).toHaveProperty(color);
      });
    });
  });

  describe("間距系統", () => {
    it("應該定義標準間距", () => {
      const requiredSpacing = ["0", "1", "2", "4", "8", "16"];

      requiredSpacing.forEach((space) => {
        expect(defaultSystem.theme.tokens.spacing).toHaveProperty(space);
      });
    });

    it("應該匹配間距系統快照", () => {
      expect(defaultSystem.theme.tokens.spacing).toMatchSnapshot("design-spacing");
    });
  });

  describe("字體系統", () => {
    it("應該定義字體大小", () => {
      const requiredFontSizes = ["xs", "sm", "md", "lg", "xl", "2xl"];

      requiredFontSizes.forEach((size) => {
        expect(defaultSystem.theme.tokens.fontSizes).toHaveProperty(size);
      });
    });

    it("應該匹配字體大小快照", () => {
      expect(defaultSystem.theme.tokens.fontSizes).toMatchSnapshot("design-font-sizes");
    });

    it("應該定義字重", () => {
      const requiredFontWeights = ["normal", "medium", "semibold", "bold"];

      requiredFontWeights.forEach((weight) => {
        expect(defaultSystem.theme.tokens.fontWeights).toHaveProperty(weight);
      });
    });
  });

  describe("陰影系統", () => {
    it("應該定義標準陰影", () => {
      const requiredShadows = ["xs", "sm", "md", "lg", "xl"];

      requiredShadows.forEach((shadow) => {
        expect(defaultSystem.theme.tokens.shadows).toHaveProperty(shadow);
      });
    });

    it("應該匹配陰影系統快照", () => {
      expect(defaultSystem.theme.tokens.shadows).toMatchSnapshot("design-shadows");
    });
  });
});

describe("Design System - Component Variants", () => {
  describe("Button 元件", () => {
    it("應該渲染所有 Button 變體", () => {
      const variants = ["solid", "outline", "ghost", "subtle"];

      variants.forEach((variant) => {
        const { container } = render(
          <Button variant={variant}>測試按鈕</Button>,
          { wrapper: ChakraWrapper }
        );

        expect(container).toMatchSnapshot(`button-variant-${variant}`);
      });
    });

    it("應該渲染所有 Button 大小", () => {
      const sizes = ["xs", "sm", "md", "lg"];

      sizes.forEach((size) => {
        const { container } = render(
          <Button size={size}>測試按鈕</Button>,
          { wrapper: ChakraWrapper }
        );

        expect(container).toMatchSnapshot(`button-size-${size}`);
      });
    });

    it("應該渲染所有顏色方案", () => {
      const colorSchemes = ["gray", "blue", "green", "red", "orange"];

      colorSchemes.forEach((colorScheme) => {
        const { container } = render(
          <Button colorScheme={colorScheme}>測試按鈕</Button>,
          { wrapper: ChakraWrapper }
        );

        expect(container).toMatchSnapshot(`button-color-${colorScheme}`);
      });
    });

    it("應該渲染 loading 狀態", () => {
      const { container } = render(
        <Button loading>載入中</Button>,
        { wrapper: ChakraWrapper }
      );

      expect(container).toMatchSnapshot("button-loading");
    });

    it("應該渲染 disabled 狀態", () => {
      const { container } = render(
        <Button disabled>禁用按鈕</Button>,
        { wrapper: ChakraWrapper }
      );

      expect(container).toMatchSnapshot("button-disabled");
    });
  });

  describe("Badge 元件", () => {
    it("應該渲染所有 Badge 變體", () => {
      const variants = ["solid", "subtle", "outline"];

      variants.forEach((variant) => {
        const { container } = render(
          <Badge variant={variant}>狀態</Badge>,
          { wrapper: ChakraWrapper }
        );

        expect(container).toMatchSnapshot(`badge-variant-${variant}`);
      });
    });

    it("應該渲染所有顏色方案", () => {
      const colorSchemes = ["gray", "green", "red", "blue", "yellow"];

      colorSchemes.forEach((colorScheme) => {
        const { container } = render(
          <Badge colorScheme={colorScheme}>狀態</Badge>,
          { wrapper: ChakraWrapper }
        );

        expect(container).toMatchSnapshot(`badge-color-${colorScheme}`);
      });
    });
  });

  describe("Card 元件", () => {
    it("應該渲染標準 Card", () => {
      const { container } = render(
        <Card.Root>
          <Card.Header>
            <Heading size="md">卡片標題</Heading>
          </Card.Header>
          <Card.Body>
            <Text>卡片內容</Text>
          </Card.Body>
        </Card.Root>,
        { wrapper: ChakraWrapper }
      );

      expect(container).toMatchSnapshot("card-default");
    });

    it("應該渲染不同大小的 Card", () => {
      const sizes = ["sm", "md", "lg"];

      sizes.forEach((size) => {
        const { container } = render(
          <Card.Root size={size}>
            <Card.Body>測試內容</Card.Body>
          </Card.Root>,
          { wrapper: ChakraWrapper }
        );

        expect(container).toMatchSnapshot(`card-size-${size}`);
      });
    });
  });

  describe("Tag 元件", () => {
    it("應該渲染所有 Tag 變體", () => {
      const variants = ["solid", "subtle", "outline"];

      variants.forEach((variant) => {
        const { container } = render(
          <Tag.Root variant={variant}>
            <Tag.Label>標籤</Tag.Label>
          </Tag.Root>,
          { wrapper: ChakraWrapper }
        );

        expect(container).toMatchSnapshot(`tag-variant-${variant}`);
      });
    });

    it("應該渲染帶關閉按鈕的 Tag", () => {
      const { container } = render(
        <Tag.Root>
          <Tag.Label>可關閉標籤</Tag.Label>
          <Tag.CloseTrigger />
        </Tag.Root>,
        { wrapper: ChakraWrapper }
      );

      expect(container).toMatchSnapshot("tag-with-close");
    });
  });
});

describe("Design System - Typography", () => {
  it("應該渲染所有 Heading 大小", () => {
    const sizes = ["xs", "sm", "md", "lg", "xl", "2xl"];

    sizes.forEach((size) => {
      const { container } = render(
        <Heading size={size}>標題文字</Heading>,
        { wrapper: ChakraWrapper }
      );

      expect(container).toMatchSnapshot(`heading-size-${size}`);
    });
  });

  it("應該渲染所有 Text 大小", () => {
    const sizes = ["xs", "sm", "md", "lg", "xl"];

    sizes.forEach((size) => {
      const { container } = render(
        <Text fontSize={size}>正文文字</Text>,
        { wrapper: ChakraWrapper }
      );

      expect(container).toMatchSnapshot(`text-size-${size}`);
    });
  });

  it("應該渲染不同字重", () => {
    const weights = ["normal", "medium", "semibold", "bold"];

    weights.forEach((weight) => {
      const { container } = render(
        <Text fontWeight={weight}>文字內容</Text>,
        { wrapper: ChakraWrapper }
      );

      expect(container).toMatchSnapshot(`text-weight-${weight}`);
    });
  });
});

describe("Design System - Spacing", () => {
  it("應該應用標準間距", () => {
    const spacings = ["2", "4", "8", "16"];

    spacings.forEach((spacing) => {
      const { container } = render(
        <Box p={spacing}>間距測試</Box>,
        { wrapper: ChakraWrapper }
      );

      expect(container).toMatchSnapshot(`spacing-${spacing}`);
    });
  });

  it("應該應用不同的 margin", () => {
    const { container } = render(
      <>
        <Box m="2">Margin 2</Box>
        <Box m="4">Margin 4</Box>
        <Box m="8">Margin 8</Box>
      </>,
      { wrapper: ChakraWrapper }
    );

    expect(container).toMatchSnapshot("margin-variations");
  });

  it("應該應用不同的 padding", () => {
    const { container } = render(
      <>
        <Box p="2">Padding 2</Box>
        <Box p="4">Padding 4</Box>
        <Box p="8">Padding 8</Box>
      </>,
      { wrapper: ChakraWrapper }
    );

    expect(container).toMatchSnapshot("padding-variations");
  });
});

describe("Design System - Accessibility", () => {
  it("Button 應該包含無障礙屬性", () => {
    const { container } = render(
      <Button aria-label="測試按鈕">點擊我</Button>,
      { wrapper: ChakraWrapper }
    );

    const button = container.querySelector("button");
    expect(button).toHaveAttribute("aria-label");
    expect(button).toMatchSnapshot("button-accessibility");
  });

  it("Badge 應該有適當的 role", () => {
    const { container } = render(
      <Badge>狀態徽章</Badge>,
      { wrapper: ChakraWrapper }
    );

    expect(container).toMatchSnapshot("badge-accessibility");
  });

  it("顏色對比度應該符合 WCAG 標準", () => {
    // 這是一個示例，實際實作需要使用顏色對比度計算庫
    const { container } = render(
      <>
        <Button colorScheme="blue">主要按鈕</Button>
        <Button variant="outline">次要按鈕</Button>
        <Badge colorScheme="red">錯誤</Badge>
        <Badge colorScheme="green">成功</Badge>
      </>,
      { wrapper: ChakraWrapper }
    );

    expect(container).toMatchSnapshot("color-contrast");
  });
});

describe("Design System - Responsive Design", () => {
  it("應該渲染響應式間距", () => {
    const { container } = render(
      <Box p={{ base: "2", md: "4", lg: "8" }}>響應式間距</Box>,
      { wrapper: ChakraWrapper }
    );

    expect(container).toMatchSnapshot("responsive-spacing");
  });

  it("應該渲染響應式字體大小", () => {
    const { container } = render(
      <Text fontSize={{ base: "sm", md: "md", lg: "lg" }}>
        響應式文字
      </Text>,
      { wrapper: ChakraWrapper }
    );

    expect(container).toMatchSnapshot("responsive-typography");
  });

  it("應該渲染響應式顯示", () => {
    const { container } = render(
      <Box display={{ base: "none", md: "block" }}>
        只在中等以上螢幕顯示
      </Box>,
      { wrapper: ChakraWrapper }
    );

    expect(container).toMatchSnapshot("responsive-display");
  });
});

/**
 * 設計系統驗證測試的最佳實踐：
 *
 * 1. 定期執行以確保設計一致性
 * 2. 在 Design System 更新時更新快照
 * 3. 測試所有元件變體和狀態
 * 4. 驗證無障礙性屬性
 * 5. 測試響應式行為
 * 6. 記錄設計 tokens 的預期值
 * 7. 與設計師協作維護測試
 *
 * 這些測試的價值：
 * - 防止意外的樣式變更
 * - 確保設計系統的一致性
 * - 文檔化設計決策
 * - 提供設計系統的自動化驗證
 * - 協助新團隊成員理解設計規範
 */
