# 预训练数据处理

```python
def move_url_modifier(page: Dict) -> List[Dict]:
    page[URL] = page['metadata']['WARC-Target-URI']
    return [page]


def url_removal_modifier(tlds_filepath="baselines/mappers/iana_tlds.txt"):
    """
    Modifies the input JSON object - Removes all urls within the content of a page, relying
    on two regexes for finding URLs: one relies upon a "vocab list" of existing top-level domains (TLDs),
    such as ".com", ".org", etc.; the other detects IP addresses

    Arguments:
    page -- A dictionary representing a JSON object. It should have a 'content' field
            that contains the text to be analyzed.
    tlds_filepath -- Path to a text file where the TLDs vocab is stored. The default is the path
            to the full list from IANA (https://www.iana.org/domains/root/db) assuming you are in the
            root directory of the dcnlp project.

    Returns:
    A list containing the input JSON object with urls in the text removec
    """
    with open(tlds_filepath, "r") as file:
        tlds_list = [re.escape(tld) for tld in file.read().splitlines()]

    # Create a simplified pattern to check if any TLDs are in the text
    tlds_regex = Blacklist(tlds_list, match_substrings=True).compiled

    # Detailed URL regex to detect URLs based on TLDs
    url_regex = re.compile(
        rf'\s{{0,10}}(?:((https?|ftp)://))?[-a-zA-Z0-9@:%._\+~#=]{{1,256}}\.({tlds_regex.pattern})\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)')

    # Regex to detect IP addresses
    ipv4_regex = re.compile(
        r'\s{0,10}\b((https?|ftp)://)?(?:[0-2]?[0-9]{1,2}\.){3}[0-2]?[0-9]{1,2}[-a-zA-Z0-9()@:%_\+.~#?&//=]*')

    def modify(page: Dict) -> List[Dict]:
        # First, check for URLs based on TLDs
        if tlds_regex.match(page[CONTENT]):
            page[CONTENT] = url_regex.sub("", page[CONTENT])

        # Continue with removing IP addresses
        page[CONTENT] = ipv4_regex.sub("", page[CONTENT])

        if page[CONTENT] == '':
            return []

        return [page]

    return modify


def newline_removal_modifier(max_consecutive=2):
    """
    This modifier normalizes line spacing by controlling for the maximum allowed consecutive newline characters ('\n')
    within a page.

    Arguments:
    - page (Dict): A dictionary representing a JSON object. It should have a CONTENT field
            that contains the text to be analyzed.
    - max_consecutive (int): The maximum number of consecutive newline characters to allow.

    Returns:
    A list containing the modified version of the input JSON object.
    """
    pattern = re.compile(r'\n{%d,}' % (max_consecutive + 1))

    def modify(page):
        page[CONTENT] = pattern.sub('\n' * max_consecutive, page[CONTENT])
        return [page]

    return modify

```



网页去重

```python
def massive_web_repetition_filters(page: Dict, skip_paragraph=False) -> List[Dict]:
    """
    Applies the repetition filters from Gopher (Rae et al., 2021)
    Calls repetition_filter across many different granularities
    for {2,3,4}-grams we need to count the fraction of characters in the most common n-gram, and
    for {5,6,7,8,9,10}-grams we count the function of characters appearing in n-grams that repeat more than once

    Arguments:
    page -- A dictionary representing a JSON object. It should have a CONTENT field
            that contains the text to be analyzed.
    skip_paragraph -- If True, skips the paragraph-based filters, such as in the case where text extraction does
            not distinguish lines v.s. paragraphs.
    Returns:
    A list containing the input JSON object if it passes the set of repetition filters,
    or an empty list if it doesn't.
    """

    cache = {}
    if len(repetition_filter(page, "line", 0.3, count_characters=False, cache=cache)) == 0:
        return []
    elif not skip_paragraph and len(
            repetition_filter(page, "paragraph", 0.3, count_characters=False, cache=cache)) == 0:
        return []
    elif len(repetition_filter(page, "line", 0.2, cache=cache)) == 0:
        return []
    elif not skip_paragraph and len(repetition_filter(page, "paragraph", 0.2, cache=cache)) == 0:
        return []
    elif len(repetition_filter(page, 2, 0.2, cache=cache)) == 0:
        return []
    elif len(repetition_filter(page, 3, 0.18, cache=cache)) == 0:
        return []
    elif len(repetition_filter(page, 4, 0.16, cache=cache)) == 0:
        return []
    elif len(repetition_filter(page, 5, 0.15, cache=cache)) == 0:
        return []
    elif len(repetition_filter(page, 6, 0.14, cache=cache)) == 0:
        return []
    elif len(repetition_filter(page, 7, 0.13, cache=cache)) == 0:
        return []
    elif len(repetition_filter(page, 8, 0.12, cache=cache)) == 0:
        return []
    elif len(repetition_filter(page, 9, 0.11, cache=cache)) == 0:
        return []
    elif len(repetition_filter(page, 10, 0.10, cache=cache)) == 0:
        return []
    else:
        return [page]


def repetition_filter(page: Dict, granularity: Union[str, int], max_fraction: float, 
                      count_characters: bool=True, ngram_char_ratio: str=None, ignore_case: bool=False, cache: Dict=None) -> List[Dict]:
    """
    该函数测量不同粒度下的重复率。根据内容字段的重复比例，按照指定粒度（行、段、n-gram）过滤JSON页面。
    如果内容中重复部分所占比例超过 max_fraction，返回空列表；否则返回包含原始页面的列表。

    @param page: 一个字典，表示一条JSON数据，必须包含一个内容字段（CONTENT）.
    @granularity: 重复检测的粒度，可以是字符串 {"line", "paragraph"} 或整数（n-gram 的 n 值）.
    @max_fraction: 可接受的最大重复比例（超过则过滤）.
    @count_characters: 是否按字符数计算重复（对 line / paragraph 粒度有效）. Defaults to True.
    @ngram_char_ratio: -- When the granularity is n-grams, this specifies what ratio to measure. Choices are either 'most_common' which
            which looks at the characters taken up by the most repeated n-gram and 'all' which looks at characters taken up by all
            repeated n-grams (without double counting words). If not supplied, uses the defaults from Gopher for various n-gram sizes. 
    @ignore_case: 是否忽略大小写
    @cache: 缓存字典，可复用重复计算的结果，加速处理.

    Returns:
    """
    if page[CONTENT] == '':  # 内容为空，直接过滤
        return []

    if cache is None:  # 初始化缓存
        cache = {}

    text = page[CONTENT].lower() if ignore_case else page[CONTENT]  # 转小写

    if isinstance(granularity, str):  # 处理 line 和 paragraph
        assert granularity in ['line', 'paragraph'], "granularity must be either 'line', 'paragraph', or an int"
        sep = '\n\n' if granularity == 'paragraph' else '\n'

        if granularity not in cache:
            cache[granularity] = segments = split_paragraphs(text, paragraph_end=sep, remove_empty=True)
        else:
            segments = cache[granularity]

        if len(segments) == 1:  # 只有一个分段，说明无法重复
            return [page]
        elif len(segments) == 0:  # 没有分段，移除
            return []

        # 缓存总字符数和每段出现次数
        if granularity + '/count' not in cache:
            cache[granularity + '/chars'] = total_chars = sum(len(s) for s in segments)  # Do not count empty lines as characters
            cache[granularity + '/count'] = segment_counts = Counter(segments)
        else:
            total_chars = cache[granularity + '/chars']
            segment_counts = cache[granularity + '/count']

        if count_characters:
            repeated_fraction = sum((len(segment) * count) for segment, count in segment_counts.items() if count > 1) / total_chars
        else:
            repeated_fraction = sum(count for count in segment_counts.values() if count > 1) / len(segments)
        
        if repeated_fraction > max_fraction:
            return []

    elif isinstance(granularity, int):  # 处理 n-gram
        if 'words' not in cache:
            cache['words'] = words = split_words(text, ignore_punctuation=True, model='uniseg')
            cache['words/chars'] = total_chars = sum(len(w) for w in words) # Do not count whitespace/punctuation as characters for words
        else:
            words = cache['words']
            total_chars = cache['words/chars']

        # No point caching the n-grams, we are using each granularity only once
        n_grams = list(ngrams(words, granularity))    

        if len(n_grams) == 0:
            return [page]

        # Use the gopher default settings if ngram_char_ratio is not explicitly supplied
        if ngram_char_ratio is None:
            if granularity in {2,3,4}:
                ngram_char_ratio = 'most_common'
            elif granularity in {5,6,7,8,9,10}:
                ngram_char_ratio = 'all'
            else:
                raise ValueError("For n-gram counts, if ngram_char_ratio is not given, the granularity must be one of {2,3,4,5,6,7,8,9,10}")

        # No point caching the n-grams Counter, we are using each granularity only once
        ngram_counts = Counter(n_grams)

        # If no n-grams are repeated, then just return the page
        ordered_counts = ngram_counts.most_common()
        most_common_ngram, most_common_count = ordered_counts[0]
        if most_common_count == 1:
            return [page]

        if ngram_char_ratio == 'most_common':
            # Check if there is a longer n-gram (in chars) that also has the same count 
            most_common_length = sum(len(w) for w in most_common_ngram)
            for ngram, count in ordered_counts:
                if count != most_common_count:
                    break
                else:
                    ngram_length = sum(len(w) for w in ngram)
                    most_common_length = max(ngram_length, most_common_length)

            most_common_char_count = most_common_length * most_common_count
            repeated_fraction = most_common_char_count / total_chars
        elif ngram_char_ratio == 'all':
            repeated_word_indices = set()
            for idx, ngram in enumerate(n_grams):
                if ngram_counts[ngram] > 1:
                    repeated_word_indices.update(range(idx, idx + granularity))
            repeated_word_char_count = sum((len(words[i]) for i in repeated_word_indices))
            repeated_fraction = repeated_word_char_count / total_chars
        else:
            raise ValueError("For n-gram counts, ngram_char_ratio must one of {None, 'most_common', 'all'}")

        if repeated_fraction > max_fraction:
            return []

    else:
        raise ValueError("granularity must be either 'line', 'paragraph', or an int")

    return [page]


def split_paragraphs(text: str, paragraph_end='\n', remove_empty: bool = True) -> List[str]:
    paragraphs = re.split(paragraph_end, text)
    if remove_empty is True:
        # x := y ==> x = y \n if x: (就是定义的意思) 
        paragraphs = [p for par in paragraphs if (p := par.strip())]
    return paragraphs

```


数据去重 Bloom

