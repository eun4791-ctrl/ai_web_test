# 하나투어 검색 기능 테스트 계획

## Application Overview

하나투어 웹사이트의 검색 기능이 사용자의 다양한 입력을 올바르게 처리하며 관련된 결과를 반환하는지를 확인합니다.

## Test Scenarios

### 1. 검색 기능 테스트

**Seed:** `tests/search-function.spec.ts`

#### 1.1. 정상 검색 기능 테스트

**File:** `tests/search-function/normal-search.spec.ts`

**Steps:**
  1. '검색어' 텍스트 상자에 '서울' 입력
  2. '검색' 버튼 클릭

**Expected Results:**
  - 서울 관련 여행 제품 리스트 페이지로 이동

#### 1.2. 잘못된 검색어 입력 시 반응 테스트

**File:** `tests/search-function/invalid-search.spec.ts`

**Steps:**
  1. '검색어' 텍스트 상자에 의미없는 문자열 입력(e.g., 'asdf1234')
  2. '검색' 버튼 클릭

**Expected Results:**
  - '검색 결과가 없습니다.'라는 메시지 혹은 관련 없는 결과 페이지 노출

#### 1.3. 빈 검색어 입력 시 반응 테스트

**File:** `tests/search-function/empty-search.spec.ts`

**Steps:**
  1. '검색어' 텍스트 상자를 비워둔 채 '검색' 버튼 클릭

**Expected Results:**
  - '검색어를 입력해 주세요.'라는 오류 메시지 노출

#### 1.4. 검색 재시도 테스트

**File:** `tests/search-function/retry-search.spec.ts`

**Steps:**
  1. 정상 검색 실행 후 '뒤로 가기' 버튼 클릭
  2. 다른 검색어 입력 후 '검색' 버튼 클릭

**Expected Results:**
  - 새로운 검색어에 따른 결과 페이지로 이동

#### 1.5. 특수 문자 검색 시 반응 테스트

**File:** `tests/search-function/special-char-search.spec.ts`

**Steps:**
  1. '검색어' 텍스트 상자에 특수문자 입력 (e.g., '!@#$%^')
  2. '검색' 버튼 클릭

**Expected Results:**
  - 특수문자에 대해 제대로 처리하며 오류 없는 상태 유지
