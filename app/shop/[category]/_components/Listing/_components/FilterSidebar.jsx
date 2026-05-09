import React, { useState, useRef } from "react";

const FilterSidebar = ({
  subCategoriesData,
  selectedSubCatIds,
  handleToggleCategory,
  styles,
}) => {

  const [openMenus, setOpenMenus] = useState({});
  const [openNested, setOpenNested] = useState({});

  // Refs to measure exact content height for smooth animation
  const topRefs = useRef({});
  const nestedRefs = useRef({});

  const toggleMenu = (id, isNested = false) => {
    if (isNested) {
      setOpenNested((prev) => ({ [id]: !prev[id] }));
    } else {
      setOpenMenus((prev) => ({ [id]: !prev[id] }));
      setOpenNested({});
    }
  };

  // Returns inline maxHeight for the AnimatedBox — exact scrollHeight when open, 0 when closed
  const getMaxHeight = (id, isOpen, refsMap) => {
    if (!isOpen) return "0px";
    const el = refsMap.current[id];
    return el ? el.scrollHeight + "px" : "500px";
  };

  const getSelectedCountForParent = (item) => {
    let count = 0;
    const stack = [item];
    while (stack.length > 0) {
      const current = stack.pop();
      if (selectedSubCatIds.includes(current.id)) count++;
      if (current.level2 && Array.isArray(current.level2)) stack.push(...current.level2);
      if (current.level3 && Array.isArray(current.level3)) stack.push(...current.level3);
    }
    return count;
  };

  function renderCategoriesRecursive(levels) {
    if (!levels || !Array.isArray(levels) || levels.length === 0) return null;

    return levels.map((item) => {
      const children = [...(item.level2 || []), ...(item.level3 || [])];
      const hasChildren = children.length > 0;
      const itemId = item.id;

      if (hasChildren) {
        return (
          <div
            key={item.id}
            className={styles.FilterBox}
            style={{ border: "none", padding: "0", marginTop: "10px" }}
          >
            <div
              className={styles.FilterHeader}
              onClick={() => toggleMenu(item.id, true)}
            >
              <h5 style={{ fontSize: "14px", color: "#6e736a" }}>
                {item.name}{" "}
                {getSelectedCountForParent(item) > 0 &&
                  `(${getSelectedCountForParent(item)})`}
              </h5>
              {openNested[item.id] ? (
                <span style={{ fontSize: "12px" }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M-0.000177827 8.48503L3.77106 4.7138L-0.000178165 0.942561L0.942631 -0.000248161L4.71387 3.77099L8.4851 -0.000248161L9.42791 0.942561L5.65668 4.7138L9.42791 8.48503L8.4851 9.42784L4.71387 5.65661L0.942631 9.42784L-0.000177827 8.48503Z" fill="#6E736A" />
                  </svg>
                </span>
              ) : (
                <span style={{ fontSize: "12px" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.33333 12V6.66667H0V5.33333H5.33333V0H6.66667V5.33333H12V6.66667H6.66667V12H5.33333Z" fill="#6E736A" />
                  </svg>
                </span>
              )}
            </div>

            <div
              ref={(el) => { nestedRefs.current[item.id] = el; }}
              className={`${styles.AnimatedBox} ${openNested[item.id] ? styles.open : ""}`}
              style={{ maxHeight: getMaxHeight(item.id, openNested[item.id], nestedRefs) }}
            >
              <div
                className={styles.FilterOptions}
                style={{ marginTop: "8px", paddingLeft: "10px" }}
              >
                {renderCategoriesRecursive(children)}
              </div>
            </div>
          </div>
        );
      }

      return (
        <label key={item.id}>
          <input
            type="checkbox"
            checked={selectedSubCatIds.includes(itemId)}
            onChange={() => handleToggleCategory(itemId)}
          />
          {item.name}
        </label>
      );
    });
  }

  return (
    <div
      className={styles.LeftBottom}
      style={{ gap: "0px", display: "flex", flexDirection: "column" }}
    >
      {subCategoriesData?.level1?.map((item) => {
        const children = [...(item.level2 || []), ...(item.level3 || [])];
        const itemId = item.id;
        const selectedCount = getSelectedCountForParent(item);

        return (
          <div key={item.id} className={styles.FilterBox}>
            <div
              className={styles.FilterHeader}
              onClick={() => toggleMenu(item.id)}
            >
              <h5>
                {item.name} {selectedCount > 0 && `(${selectedCount})`}
              </h5>
              {openMenus[item.id] ? (
                <span>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M-0.000177827 8.48503L3.77106 4.7138L-0.000178165 0.942561L0.942631 -0.000248161L4.71387 3.77099L8.4851 -0.000248161L9.42791 0.942561L5.65668 4.7138L9.42791 8.48503L8.4851 9.42784L4.71387 5.65661L0.942631 9.42784L-0.000177827 8.48503Z" fill="#6E736A" />
                  </svg>
                </span>
              ) : (
                <span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.33333 12V6.66667H0V5.33333H5.33333V0H6.66667V5.33333H12V6.66667H6.66667V12H5.33333Z" fill="#6E736A" />
                  </svg>
                </span>
              )}
            </div>

            <div
              ref={(el) => { topRefs.current[item.id] = el; }}
              className={`${styles.AnimatedBox} ${openMenus[item.id] ? styles.open : ""}`}
              style={{ maxHeight: getMaxHeight(item.id, openMenus[item.id], topRefs) }}
            >
              <div className={styles.FilterOptions}>
                {children.length > 0 ? (
                  renderCategoriesRecursive(children)
                ) : (
                  <label key={item.slug}>
                    <input
                      type="checkbox"
                      checked={selectedSubCatIds.includes(itemId)}
                      onChange={() => handleToggleCategory(itemId)}
                    />
                    {item.name}
                  </label>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FilterSidebar;
